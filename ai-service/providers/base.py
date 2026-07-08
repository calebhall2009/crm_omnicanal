from abc import ABC, abstractmethod
from typing import Dict, Any, List

class AIProvider(ABC):
    """
    Interfaz abstracta para proveedores de Inteligencia Artificial en OmniFlow.
    Permite escalar o cambiar de proveedor (Gemini, OpenAI, Anthropic, etc.) de forma trivial.
    """

    @abstractmethod
    async def generar_respuesta(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generar respuesta automatizada o sugerida basándose en el contexto y base de conocimiento.
        Retorna: {'text': str, 'confidence': float, 'tokens_used': int, 'cost': float, 'model': str}
        """
        pass

    @abstractmethod
    async def clasificar_intencion(self, texto: str) -> str:
        """
        Clasificar la intención del cliente (ej: pricing, support, complaint, general).
        """
        pass

    @abstractmethod
    async def analizar_sentimiento(self, texto: str) -> str:
        """
        Analizar sentimiento del mensaje (positive, neutral, negative).
        """
        pass

    @abstractmethod
    async def calificar_lead(self, texto: str, historial: List[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Calificar y priorizar un lead comercial basándose en la conversación.
        Retorna: {'score': int (0-100), 'priority': str (low, medium, high), 'reason': str}
        """
        pass
