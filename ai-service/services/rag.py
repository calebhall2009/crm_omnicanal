import os
import json
import sqlite3
import logging
import ollama
import numpy as np

logger = logging.getLogger(__name__)

SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/database/database.sqlite'))

async def retrieve_rag_context(company_id: int, query: str, top_k: int = 3) -> list:
    """
    Genera embedding para la consulta y busca los chunks más similares en SQLite
    calculando la similitud del coseno.
    """
    try:
        # Generar embedding de la consulta
        response = ollama.embeddings(model="nomic-embed-text", prompt=query)
        query_embedding = np.array(response['embedding'])
    except Exception as e:
        logger.error(f"Error generando embedding de consulta con Ollama: {e}")
        return []

    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        
        # Obtener chunks activos para esta empresa
        cursor.execute("""
            SELECT c.content, c.embedding 
            FROM ai_document_chunks c
            JOIN ai_knowledge_documents d ON c.ai_knowledge_document_id = d.id
            WHERE c.company_id = ? AND d.status = 'active'
        """, (company_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return []

        # Calcular similitud del coseno
        results = []
        for content, embedding_json in rows:
            try:
                chunk_embedding = np.array(json.loads(embedding_json))
                
                # Similitud Coseno: (A dot B) / (norm(A) * norm(B))
                dot_product = np.dot(query_embedding, chunk_embedding)
                norm_a = np.linalg.norm(query_embedding)
                norm_b = np.linalg.norm(chunk_embedding)
                
                if norm_a == 0 or norm_b == 0:
                    similarity = 0
                else:
                    similarity = dot_product / (norm_a * norm_b)
                
                results.append({'content': content, 'similarity': similarity})
            except Exception as e:
                logger.error(f"Error parseando embedding de DB: {e}")
                continue

        # Ordenar por similitud y tomar los mejores
        results.sort(key=lambda x: x['similarity'], reverse=True)
        top_results = results[:top_k]
        
        # Retornar los contenidos con un threshold mínimo de similitud
        # Ajustar el threshold empíricamente, por ahora 0.6
        valid_chunks = [res['content'] for res in top_results if res['similarity'] > 0.6]
        
        return valid_chunks
        
    except Exception as e:
        logger.error(f"Error buscando contexto RAG en SQLite: {e}")
        return []
