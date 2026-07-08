from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Channels Service",
    description="FastAPI service for channel integrations (WhatsApp, Instagram, Telegram)",
    version="1.0.0"
)

# CORS middleware configuration
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
        "message": "Welcome to the Channels Service!",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "channels-service"
    }
