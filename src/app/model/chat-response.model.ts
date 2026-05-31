import { ChatMessage } from './chat-message.model';

export interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
}
