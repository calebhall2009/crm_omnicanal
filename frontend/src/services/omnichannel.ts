import type { ChannelConnection, ChannelType, Conversation, Message } from '../types/omnichannel';

export type FetchApi = (url: string, options?: RequestInit) => Promise<Response>;

export const getChannels = async (fetchApi: FetchApi): Promise<ChannelConnection[]> => {
  const res = await fetchApi('/api/channels');
  if (!res.ok) throw new Error('Error al cargar los canales');
  return res.json();
};

export const connectChannel = async (
  fetchApi: FetchApi,
  data: { channel_type: ChannelType; account_id?: string; credentials?: Record<string, any>; metadata?: Record<string, any> }
): Promise<ChannelConnection> => {
  const res = await fetchApi('/api/channels', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al conectar el canal');
  }
  return res.json();
};

export const disconnectChannel = async (
  fetchApi: FetchApi,
  id: number
): Promise<void> => {
  const res = await fetchApi(`/api/channels/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Error al desconectar el canal');
};

export const getConversations = async (
  fetchApi: FetchApi,
  filters?: { channel?: string; status?: string; search?: string }
): Promise<Conversation[]> => {
  const params = new URLSearchParams();
  if (filters?.channel && filters.channel !== 'all') params.append('channel', filters.channel);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.search?.trim()) params.append('search', filters.search.trim());

  const res = await fetchApi(`/api/inbox/conversations?${params.toString()}`);
  if (!res.ok) throw new Error('Error al cargar conversaciones');
  return res.json();
};

export const getConversationThread = async (
  fetchApi: FetchApi,
  id: number
): Promise<{ conversation: Conversation; messages: Message[] }> => {
  const res = await fetchApi(`/api/inbox/conversations/${id}`);
  if (!res.ok) throw new Error('Error al cargar el hilo de mensajes');
  return res.json();
};

export const sendAgentMessage = async (
  fetchApi: FetchApi,
  conversationId: number,
  content: string,
  isTemplate = false
): Promise<Message> => {
  const res = await fetchApi(`/api/inbox/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, is_template: isTemplate }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al enviar mensaje');
  }
  return res.json();
};
