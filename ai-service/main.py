import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import config
from services.worker import run_worker
from services.agent import process_message

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

worker_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global worker_task
    logger.info("Iniciando servicio ai-service y lanzando Worker Redis en segundo plano...")
    worker_task = asyncio.create_task(run_worker())
    yield
    logger.info("Apagando servicio ai-service y cancelando Worker...")
    if worker_task:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass

app = FastAPI(
    title="OmniFlow AI Service",
    description="Microservicio FastAPI para Inteligencia Artificial (Gemini, Colas Redis, FAQ, Lead Scoring)",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "ai-service",
        "provider": config.AI_PROVIDER,
        "model": config.DEFAULT_MODEL,
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "redis_queue": config.REDIS_QUEUE_NAME,
        "worker_active": worker_task is not None and not worker_task.done()
    }

@app.post("/test-process")
async def test_process(payload: dict):
    """
    Endpoint manual para probar el procesamiento de un mensaje sin pasar por Redis.
    """
    res = await process_message(payload)
    return res
