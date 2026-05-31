import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChatMessage } from '../model/chat-message.model';
import { ChatSession } from '../model/chat-session.model';
import { ChatStorageService } from './chat-storage.service';
import { OllamaService } from './ollama.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private storage = inject(ChatStorageService);
  private ollama = inject(OllamaService);

  readonly chats = signal<ChatSession[]>([]);
  readonly activeChatId = signal<string | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeChat = computed(() => {
    const id = this.activeChatId();
    return this.chats().find((chat) => chat.id === id) ?? null;
  });

  async init(): Promise<void> {
    const chats = await this.storage.getAllChats();
    this.chats.set(chats);

    if (chats.length > 0) {
      this.activeChatId.set(chats[0].id);
    } else {
      await this.createChat();
    }
  }

  async createChat(): Promise<void> {
    const now = Date.now();
    const chat: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New chat',
      messages: [],
      createdAt: now,
      updatedAt: now,
    };

    await this.storage.saveChat(chat);
    this.chats.update((list) => [chat, ...list]);
    this.activeChatId.set(chat.id);
    this.error.set(null);
  }

  selectChat(id: string): void {
    this.activeChatId.set(id);
    this.error.set(null);
  }

  async deleteChat(id: string): Promise<void> {
    await this.storage.deleteChat(id);

    const remaining = this.chats().filter((chat) => chat.id !== id);
    this.chats.set(remaining);

    if (this.activeChatId() === id) {
      if (remaining.length > 0) {
        this.activeChatId.set(remaining[0].id);
      } else {
        await this.createChat();
      }
    }
  }

  async sendMessage(content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed || this.isLoading()) {
      return;
    }

    const chat = this.activeChat();
    if (!chat) {
      return;
    }

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...chat.messages, userMessage];
    const updatedChat: ChatSession = {
      ...chat,
      messages: updatedMessages,
      title: chat.messages.length === 0 ? this.truncateTitle(trimmed) : chat.title,
      updatedAt: Date.now(),
    };

    this.updateChatInState(updatedChat);
    await this.storage.saveChat(updatedChat);

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const reply = await firstValueFrom(this.ollama.chat(updatedMessages));

      const assistantMessage: ChatMessage = { role: 'assistant', content: reply };
      const finalChat: ChatSession = {
        ...updatedChat,
        messages: [...updatedMessages, assistantMessage],
        updatedAt: Date.now(),
      };

      this.updateChatInState(finalChat);
      await this.storage.saveChat(finalChat);
    } catch {
      this.error.set('Could not reach Ollama. Make sure it is running on your local machine.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateChatInState(chat: ChatSession): void {
    this.chats.update((list) => {
      const index = list.findIndex((item) => item.id === chat.id);
      if (index === -1) {
        return [chat, ...list];
      }

      const next = [...list];
      next[index] = chat;
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
    });
  }

  private truncateTitle(text: string, maxLength = 32): string {
    const singleLine = text.replace(/\s+/g, ' ').trim();
    if (singleLine.length <= maxLength) {
      return singleLine;
    }
    return `${singleLine.slice(0, maxLength).trim()}…`;
  }
}
