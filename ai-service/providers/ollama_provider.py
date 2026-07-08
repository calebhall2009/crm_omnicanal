import logging
from typing import Dict, Any
import ollama
import config
from .base import AIProvider

logger = logging.getLogger(__name__)

class OllamaProvider(AIProvider):
    def __init__(self):
        self.model = config.DEFAULT_MODEL
        if self.model not in ["llama3", "phi3", "mistral"]:
            self.model = "llama3" # Default fallback
            
    async def clasificar_intencion(self, text: str) -> str:
        prompt = f"""Clasifica la intención del siguiente mensaje en una de estas categorías: [soporte, ventas, informacion, queja, otro]. Responde SOLO con la categoría.
Mensaje: '{text}'"""
        try:
            response = ollama.chat(model=self.model, messages=[
                {'role': 'user', 'content': prompt}
            ])
            return response['message']['content'].strip().lower()
        except Exception as e:
            logger.error(f"Error clasificando intención con Ollama: {e}")
            return "otro"

    async def analizar_sentimiento(self, text: str) -> str:
        prompt = f"""Clasifica el sentimiento del siguiente mensaje como: positivo, negativo, o neutral. Responde SOLO con la categoría.
Mensaje: '{text}'"""
        try:
            response = ollama.chat(model=self.model, messages=[
                {'role': 'user', 'content': prompt}
            ])
            return response['message']['content'].strip().lower()
        except Exception as e:
            logger.error(f"Error analizando sentimiento con Ollama: {e}")
            return "neutral"

    async def calificar_lead(self, text: str) -> float:
        return 0.5

    async def generar_respuesta(self, text: str, context_data: Dict[str, Any]) -> Dict[str, Any]:
        company_name = context_data.get('company_name', 'Nuestra Empresa')
        
        # Build context string
        context_str = ""
        
        faqs = context_data.get('faqs', [])
        if faqs:
            context_str += "Preguntas Frecuentes:\n"
            for faq in faqs:
                context_str += f"- Q: {faq['question']} A: {faq['answer']}\n"
                
        rag_context = context_data.get('rag_context', [])
        if rag_context:
            context_str += "\nInformación de Documentos (Base de Conocimiento):\n"
            for chunk in rag_context:
                context_str += f"- {chunk}\n"
                
        prompt = f"""Eres un asistente virtual amable y profesional para la empresa {company_name}.
Usa la siguiente información de contexto para responder a la pregunta del cliente. Si no sabes la respuesta basándote en el contexto, indica amablemente que un humano se contactará pronto.

{context_str}

Pregunta del Cliente: {text}
"""
        try:
            response = ollama.chat(model=self.model, messages=[
                {'role': 'system', 'content': 'Eres un asistente virtual experto.'},
                {'role': 'user', 'content': prompt}
            ])
            
            return {
                "text": response['message']['content'].strip(),
                "confidence": 0.85 if (faqs or rag_context) else 0.4, # Heuristic confidence
                "model": self.model,
                "tokens_used": 150,
                "cost": 0.0
            }
        except Exception as e:
            logger.error(f"Error generando respuesta con Ollama: {e}")
            return {
                "text": "Lo siento, estoy experimentando dificultades técnicas. Un asesor humano te atenderá en breve.",
                "confidence": 0.1,
                "model": self.model,
                "tokens_used": 0,
                "cost": 0.0
            }
