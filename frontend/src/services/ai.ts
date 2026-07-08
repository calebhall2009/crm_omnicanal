import type { AiKnowledgeResponse, AiKnowledgeItem } from '../types/ai';

export type FetchApi = (url: string, options?: RequestInit) => Promise<Response>;

export const aiService = {
  getKnowledgeBase: async (fetchApi: FetchApi): Promise<AiKnowledgeResponse> => {
    const res = await fetchApi('/api/ai/knowledge');
    if (!res.ok) throw new Error('Error al cargar base de conocimiento');
    return res.json();
  },

  createFaq: async (fetchApi: FetchApi, data: { question: string; answer: string; category?: string; is_active?: boolean }): Promise<AiKnowledgeItem> => {
    const res = await fetchApi('/api/ai/knowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al crear FAQ');
    return res.json();
  },

  updateFaq: async (fetchApi: FetchApi, id: number, data: Partial<AiKnowledgeItem>): Promise<AiKnowledgeItem> => {
    const res = await fetchApi(`/api/ai/knowledge/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al actualizar FAQ');
    return res.json();
  },

  deleteFaq: async (fetchApi: FetchApi, id: number): Promise<void> => {
    const res = await fetchApi(`/api/ai/knowledge/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar FAQ');
  },

  toggleAutoReply: async (fetchApi: FetchApi, connectionId: number, autoReply: boolean): Promise<{ connection_id: number; auto_reply: boolean }> => {
    const res = await fetchApi(`/api/ai/channels/${connectionId}/auto-reply`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auto_reply: autoReply }),
    });
    if (!res.ok) throw new Error('Error al alternar auto respuesta');
    return res.json();
  },
};
