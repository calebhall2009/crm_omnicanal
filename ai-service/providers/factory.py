import config
from providers.base import AIProvider
from providers.gemini import GeminiProvider
from providers.ollama_provider import OllamaProvider

def get_provider() -> AIProvider:
    """
    Factory para obtener la instancia del proveedor IA configurado.
    Permite cambiar a OpenAI, Anthropic o modelos locales cambiando AI_PROVIDER.
    """
    provider_name = config.AI_PROVIDER.lower()
    if provider_name == "gemini":
        return GeminiProvider()
    elif provider_name == "ollama":
        return OllamaProvider()
    else:
        # Por defecto o fallback
        return GeminiProvider()
