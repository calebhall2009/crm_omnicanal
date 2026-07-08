import os
from dotenv import load_dotenv

load_dotenv()

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
REDIS_QUEUE_NAME = os.getenv("REDIS_QUEUE_NAME", "omniflow:ai:incoming_messages")

# Laravel Internal API Configuration
LARAVEL_INTERNAL_URL = os.getenv("LARAVEL_INTERNAL_URL", "http://localhost:8000")
LARAVEL_INTERNAL_SECRET = os.getenv("LARAVEL_INTERNAL_SECRET", "omniflow_internal_secret_2026")

# AI Provider & Gemini Paid API Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "test_gemini_key_simulated")
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Thresholds & Rules
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.70"))
