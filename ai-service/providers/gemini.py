import json
import logging
from typing import Dict, Any, List
from providers.base import AIProvider
import config

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    if config.GEMINI_API_KEY and config.GEMINI_API_KEY != "test_gemini_key_simulated":
        genai.configure(api_key=config.GEMINI_API_KEY)
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


class GeminiProvider(AIProvider):
    """
    Implementación del proveedor Gemini (Familia Flash por defecto, configurable por variable de entorno).
    Utiliza la API de pago de Google Cloud Vertex AI / AI Studio para garantizar privacidad (DPA).
    Incluye modo de simulación inteligente para entornos de desarrollo local y pruebas automatizadas.
    """
    def __init__(self, model_name: str = None):
        self.model_name = model_name or config.DEFAULT_MODEL
        self.is_simulated = (config.GEMINI_API_KEY == "test_gemini_key_simulated" or not HAS_GENAI)
        if not self.is_simulated and HAS_GENAI:
            self.model = genai.GenerativeModel(self.model_name)

    async def generar_respuesta(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        company_name = context.get("company_name", "la empresa")
        faqs = context.get("faqs", [])
        
        # 1. Modo simulación inteligente para pruebas locales o sin key de pago activa
        if self.is_simulated:
            return self._simulate_response(prompt, company_name, faqs)

        # 2. Modo real con API de Gemini (Pago)
        faq_text = "\n".join([f"- P: {f['question']} | R: {f['answer']}" for f in faqs])
        system_instruction = (
            f"Eres el asistente automatizado de IA para la empresa {company_name}.\n"
            f"REGLAS STRICTAS:\n"
            f"1. Responde EXCLUSIVAMENTE basándote en la siguiente Base de Conocimiento:\n{faq_text}\n"
            f"2. Al inicio de tu respuesta, declara siempre que eres un asistente automatizado (ej: '🤖 Asistente IA automatizado de {company_name}: ...').\n"
            f"3. Nunca inventes información ni sostengas conversaciones abiertas o informales sin un objetivo comercial concreto.\n"
            f"4. Si la consulta no está respondida en la base de conocimiento, devuelve una confianza baja (< 0.70) para que el sistema escale a un agente humano.\n"
            f"5. Responde EN FORMATO JSON EXACTO con las claves: 'text' (string) y 'confidence' (float entre 0.0 y 1.0).\n\n"
            f"Consulta del usuario: {prompt}"
        )

        try:
            response = self.model.generate_content(
                system_instruction,
                generation_config=genai.GenerationConfig(response_mime_type="application/json")
            )
            data = json.loads(response.text)
            
            # Cálculo de costo estimado para la cuota (ejemplo para Flash: $0.075 / 1M tokens)
            tokens = len(system_instruction.split()) + len(data.get("text", "").split())
            cost = (tokens / 1_000_000) * 0.075
            
            return {
                "text": data.get("text", f"🤖 Asistente IA automatizado de {company_name}: Hola, ¿en qué te podemos ayudar?"),
                "confidence": float(data.get("confidence", 0.80)),
                "tokens_used": tokens,
                "cost": round(cost, 6),
                "model": self.model_name
            }
        except Exception as e:
            logger.error(f"Error llamando a Gemini API: {e}. Usando fallback simulado.")
            return self._simulate_response(prompt, company_name, faqs)

    def _simulate_response(self, prompt: str, company_name: str, faqs: List[Dict[str, Any]]) -> Dict[str, Any]:
        prompt_lower = prompt.lower()
        matched_answer = None
        confidence = 0.40

        for faq in faqs:
            q_words = [w for w in faq["question"].lower().split() if len(w) > 3]
            if any(w in prompt_lower for w in q_words) or ("precio" in prompt_lower and "plan" in faq["question"].lower()):
                matched_answer = faq["answer"]
                confidence = 0.95
                break

        if matched_answer:
            reply = f"🤖 Asistente IA automatizado de {company_name}: {matched_answer}"
        else:
            reply = f"🤖 Asistente IA automatizado de {company_name}: He recibido tu consulta. Como no tengo esa información específica en mi base de conocimiento, estoy escalando tu mensaje a un agente humano del equipo para que te atienda en breve."
            confidence = 0.45  # Baja confianza para disparar escalado a humano según regla 4

        return {
            "text": reply,
            "confidence": confidence,
            "tokens_used": len(prompt.split()) + len(reply.split()) + 50,
            "cost": 0.000015,
            "model": self.model_name
        }

    async def clasificar_intencion(self, texto: str) -> str:
        texto_lower = texto.lower()
        if any(w in texto_lower for w in ["precio", "costo", "cuánto", "plan", "comprar", "tarifa"]):
            return "pricing"
        elif any(w in texto_lower for w in ["ayuda", "error", "falla", "problema", "soporte", "no funciona"]):
            return "support"
        elif any(w in texto_lower for w in ["queja", "reclamo", "malo", "devolución", "cancelar"]):
            return "complaint"
        return "general"

    async def analizar_sentimiento(self, texto: str) -> str:
        texto_lower = texto.lower()
        if any(w in texto_lower for w in ["excelente", "gracias", "genial", "bueno", "perfecto", "me gusta"]):
            return "positive"
        elif any(w in texto_lower for w in ["pésimo", "malo", "molesto", "error", "horrible", "indignado", "lento"]):
            return "negative"
        return "neutral"

    async def calificar_lead(self, texto: str, historial: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        intent = await self.clasificar_intencion(texto)
        if intent == "pricing":
            return {"score": 85, "priority": "high", "reason": "Interés explícito en precios y planes comerciales"}
        elif intent == "support":
            return {"score": 40, "priority": "medium", "reason": "Consulta técnica o de soporte post-venta"}
        return {"score": 60, "priority": "medium", "reason": "Consulta general entrante"}
