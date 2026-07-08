import asyncio
import json
import logging
import redis.asyncio as redis
import config
from services.agent import process_message
from services.document_processor import process_document

logger = logging.getLogger(__name__)

async def run_worker():
    """
    Worker asíncrono que consume eventos de las colas Redis (BRPOP).
    """
    logger.info(f"Iniciando Worker IA. Conectando a Redis: {config.REDIS_URL} ...")
    
    r = redis.from_url(config.REDIS_URL, decode_responses=True)
    
    # Listen to both message incoming queue and document processing queue
    queues = [config.REDIS_QUEUE_NAME, "omniflow:ai:process_document"]

    while True:
        try:
            # BRPOP bloquea hasta que haya un mensaje en la cola (timeout de 2 seg para permitir señales)
            result = await r.brpop(queues, timeout=2)
            if result:
                queue_name, raw_payload = result
                logger.info(f"Mensaje recibido de cola {queue_name}")
                try:
                    payload = json.loads(raw_payload)
                    
                    if queue_name == "omniflow:ai:process_document":
                        # Offload CPU-bound task (document processing) to avoid blocking async loop
                        await asyncio.to_thread(process_document, payload)
                    else:
                        await process_message(payload)
                        
                except json.JSONDecodeError:
                    logger.error("Error decodificando JSON del payload de Redis.")
                except Exception as e:
                    logger.error(f"Error procesando mensaje en worker: {e}")
        except asyncio.CancelledError:
            logger.info("Worker IA cancelado.")
            break
        except Exception as e:
            logger.error(f"Error de conexión con Redis en worker: {e}. Reintentando en 5s...")
            await asyncio.sleep(5)

    await r.aclose()
