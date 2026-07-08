import logging
import json
import httpx
import os
import sqlite3
import pandas as pd
from PyPDF2 import PdfReader
import ollama
import config

logger = logging.getLogger(__name__)

# Assuming sqlite DB path based on the backend location
SQLITE_DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../backend/database/database.sqlite'))

async def process_document(payload: dict):
    """
    Lee el documento subido (PDF/Excel), extrae texto, divide en chunks, 
    genera embeddings usando Ollama local (nomic-embed-text) y 
    los guarda en la base de datos de SQLite.
    """
    company_id = payload.get("company_id")
    document_id = payload.get("document_id")
    filepath = payload.get("filepath")
    doc_type = payload.get("type", "").lower()

    logger.info(f"Procesando documento {document_id} ({doc_type}) para la empresa {company_id}...")

    if not os.path.exists(filepath):
        logger.error(f"El archivo {filepath} no existe.")
        update_doc_status(document_id, 'error')
        return

    try:
        text = ""
        if doc_type == 'pdf':
            reader = PdfReader(filepath)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        elif doc_type in ['xlsx', 'xls', 'csv']:
            if doc_type == 'csv':
                df = pd.read_csv(filepath)
            else:
                df = pd.read_excel(filepath)
            text = df.to_string(index=False)
        elif doc_type == 'txt':
            with open(filepath, 'r', encoding='utf-8') as f:
                text = f.read()
        else:
            logger.warning(f"Tipo de archivo {doc_type} no soportado nativamente, intentando leer como texto plano.")
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()

        # Simple Chunking (e.g. by paragraph or fixed length)
        chunks = chunk_text(text, chunk_size=1000, overlap=100)
        logger.info(f"Documento dividido en {len(chunks)} fragmentos.")

        # Generar embeddings y guardar
        # Asumimos que Ollama tiene el modelo "nomic-embed-text" o usamos "llama3" (aunque llama3 es ineficiente para embeddings)
        # Usaremos "nomic-embed-text"
        embed_model = "nomic-embed-text"
        
        saved_chunks = 0
        for chunk in chunks:
            if not chunk.strip():
                continue
            
            try:
                response = ollama.embeddings(model=embed_model, prompt=chunk)
                embedding_vector = response['embedding']
            except Exception as e:
                logger.error(f"Error generando embedding con Ollama: {e}")
                continue
                
            # Guardar en SQLite
            save_chunk_to_db(company_id, document_id, chunk, embedding_vector)
            saved_chunks += 1
            
        update_doc_status(document_id, 'active')
        logger.info(f"Documento {document_id} procesado exitosamente. {saved_chunks} chunks guardados.")
        
    except Exception as e:
        logger.error(f"Error procesando documento {document_id}: {e}")
        update_doc_status(document_id, 'error')

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100):
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def save_chunk_to_db(company_id, document_id, content, embedding):
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO ai_document_chunks (company_id, ai_knowledge_document_id, content, embedding, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
            (company_id, document_id, content, json.dumps(embedding))
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error guardando chunk en DB: {e}")

def update_doc_status(document_id, status):
    try:
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE ai_knowledge_documents SET status = ?, updated_at = datetime('now') WHERE id = ?",
            (status, document_id)
        )
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Error actualizando status de documento: {e}")
