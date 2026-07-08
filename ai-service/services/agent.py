import logging
import httpx
from typing import Dict, Any
import config
from providers.factory import get_provider
from services.rag import retrieve_rag_context

logger = logging.getLogger(__name__)

async def process_message(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Procesar un mensaje entrante de Redis:
    1. Obtener contexto y FAQs de Laravel
    2. Ejecutar análisis IA (respuesta, intención, sentimiento, lead scoring)
    3. Determinar acción según cuota y confianza
    4. Guardar resultado vía callback a Laravel
    """
    company_id = payload.get("company_id")
    conversation_id = payload.get("conversation_id")
    message_id = payload.get("message_id")
    content = payload.get("content", "")
    auto_reply_enabled = payload.get("auto_reply_enabled", True)

    logger.info(f"Procesando mensaje {message_id} para la empresa {company_id}...")

    # 1. Obtener contexto y FAQs de Laravel API interna
    headers = {"X-Internal-Secret": config.LARAVEL_INTERNAL_SECRET}
    context_url = f"{config.LARAVEL_INTERNAL_URL}/api/internal/ai/context/{company_id}"
    
    context_data = {
        "company_name": "Acme Corp",
        "faqs": [],
        "quota_exceeded": False
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(context_url, headers=headers)
            if resp.status_code == 200:
                context_data = resp.json()
            else:
                logger.warning(f"No se pudo obtener contexto de Laravel (HTTP {resp.status_code}). Usando defaults.")
    except Exception as e:
        logger.error(f"Error conectando con Laravel en {context_url}: {e}. Usando defaults.")

    # 1.5 Realizar búsqueda en RAG (Vector Search)
    rag_context = await retrieve_rag_context(company_id, content)
    context_data['rag_context'] = rag_context

    # 2. Ejecutar IA
    provider = get_provider()
    
    intent = await provider.clasificar_intencion(content)
    sentiment = await provider.analizar_sentimiento(content)
    lead_qual = await provider.calificar_lead(content)
    reply_data = await provider.generar_respuesta(content, context_data)

    confidence = reply_data.get("confidence", 0.0)
    reply_text = reply_data.get("text", "")
    quota_exceeded = context_data.get("quota_exceeded", False)

    # 3. Determinar acción (según reglas de negocio)
    if quota_exceeded:
        action_taken = "suggest" # Si se superó la cuota mensual, solo sugerimos, no auto-respondemos
        logger.warning(f"Empresa {company_id} superó cuota mensual. Modo sugerencia activado.")
    elif confidence < config.CONFIDENCE_THRESHOLD:
        action_taken = "escalate_to_human" # Confianza baja dispara escalado a humano
        logger.info(f"Confianza baja ({confidence} < {config.CONFIDENCE_THRESHOLD}). Escalando a humano.")
    elif auto_reply_enabled:
        action_taken = "auto_reply"
    else:
        action_taken = "suggest"

    # 4. Enviar callback a Laravel
    callback_url = f"{config.LARAVEL_INTERNAL_URL}/api/internal/ai/callback"
    callback_payload = {
        "company_id": company_id,
        "conversation_id": conversation_id,
        "message_id": message_id,
        "action_taken": action_taken,
        "reply_text": reply_text,
        "intent": intent,
        "sentiment": sentiment,
        "confidence": confidence,
        "usage_log": {
            "provider": config.AI_PROVIDER,
            "model": reply_data.get("model", config.DEFAULT_MODEL),
            "tokens_used": reply_data.get("tokens_used", 100),
            "requests_count": 1,
            "estimated_cost": reply_data.get("cost", 0.00005)
        }
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            cb_resp = await client.post(callback_url, json=callback_payload, headers=headers)
            if cb_resp.status_code == 200:
                logger.info(f"Callback enviado con éxito a Laravel (Acción: {action_taken})")
            else:
                logger.error(f"Error en callback a Laravel (HTTP {cb_resp.status_code}): {cb_resp.text}")
    except Exception as e:
        logger.error(f"Excepción enviando callback a Laravel: {e}")

    return callback_payload
