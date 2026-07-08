export interface AiKnowledgeItem {
  id: number;
  company_id: number;
  question: string;
  answer: string;
  category?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AiStats {
  requests_used: number;
  requests_max: number;
  tokens_used: number;
  estimated_cost: number;
  quota_exceeded: boolean;
}

export interface AutoReplySetting {
  connection_id: number;
  channel_type: 'whatsapp' | 'instagram' | 'telegram';
  account_id: string;
  auto_reply: boolean;
}

export interface AiKnowledgeResponse {
  faqs: AiKnowledgeItem[];
  stats: AiStats;
  auto_reply_settings: AutoReplySetting[];
}
