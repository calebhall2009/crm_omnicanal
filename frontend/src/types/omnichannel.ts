export type ChannelType = 'whatsapp' | 'instagram' | 'telegram';

export interface ChannelConnection {
  id: number;
  company_id: number;
  channel_type: ChannelType;
  account_id: string | null;
  credentials: Record<string, any>;
  status: 'active' | 'disconnected' | 'error';
  metadata: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export type MessageSenderType = 'client' | 'agent' | 'ai';

export interface Message {
  id: number;
  company_id: number;
  conversation_id: number;
  sender_type: MessageSenderType;
  content: string;
  es_generado_por_ia?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ConversationClient {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  tags?: string[];
  notes?: string;
}

export interface Conversation {
  id: number;
  company_id: number;
  client_id: number | null;
  channel: ChannelType;
  channel_connection_id: number | null;
  status: 'open' | 'closed';
  unread_count: number;
  last_client_message_at: string | null;
  is_24h_window_closed?: boolean;
  ai_suggested_reply?: string | null;
  ai_sentiment?: 'positive' | 'neutral' | 'negative' | null;
  ai_intent?: string | null;
  needs_human_escalation?: boolean;
  client?: ConversationClient;
  channel_connection?: ChannelConnection;
  messages_count?: number;
  created_at?: string;
  updated_at?: string;
}
