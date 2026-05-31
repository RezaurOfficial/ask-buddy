import { AfterViewChecked, Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { ChatService } from '../../service/chat.service';

@Component({
  selector: 'app-chat-window',
  templateUrl: './chat-window.html',
  styleUrl: './chat-window.scss',
})
export class ChatWindow implements AfterViewChecked {
  private chatService = inject(ChatService);
  private shouldScrollToBottom = false;

  protected readonly activeChat = this.chatService.activeChat;
  protected readonly isLoading = this.chatService.isLoading;
  protected readonly error = this.chatService.error;

  protected messageInput = signal('');
  protected readonly canSend = computed(() => !this.isLoading() && this.messageInput().trim().length > 0);
  private messagesContainer = viewChild<ElementRef<HTMLElement>>('messagesContainer');

  constructor() {
    effect(() => {
      const chat = this.activeChat();
      this.isLoading();
      if (chat) {
        this.shouldScrollToBottom = true;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  onInput(event: Event): void {
    this.messageInput.set((event.target as HTMLTextAreaElement).value);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    const text = this.messageInput().trim();
    if (!text) {
      return;
    }

    this.messageInput.set('');
    void this.chatService.sendMessage(text);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit(event);
    }
  }

  private scrollToBottom(): void {
    const element = this.messagesContainer()?.nativeElement;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }
}
