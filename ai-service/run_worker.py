import asyncio
import logging
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")

# Cargar variables de entorno
load_dotenv()

from services.worker import run_worker

if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        print("\nWorker detenido manualmente.")
