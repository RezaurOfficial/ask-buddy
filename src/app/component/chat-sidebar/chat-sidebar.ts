import { DatePipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { ChatService } from '../../service/chat.service';

@Component({
  selector: 'app-chat-sidebar',
  templateUrl: './chat-sidebar.html',
  styleUrl: './chat-sidebar.scss',
  imports: [DatePipe],
})
export class ChatSidebar {
  private chatService = inject(ChatService);

  readonly collapsed = input(false);
  readonly toggleCollapse = output<void>();

  protected readonly chats = this.chatService.chats;
  protected readonly activeChatId = this.chatService.activeChatId;

  onNewChat(): void {
    void this.chatService.createChat();
  }

  onSelectChat(id: string): void {
    this.chatService.selectChat(id);
  }

  onDeleteChat(event: Event, id: string): void {
    event.stopPropagation();
    void this.chatService.deleteChat(id);
  }
}
