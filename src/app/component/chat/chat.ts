import { Component, inject, OnInit, signal } from '@angular/core';
import { ChatService } from '../../service/chat.service';
import { ChatSidebar } from '../chat-sidebar/chat-sidebar';
import { ChatWindow } from '../chat-window/chat-window';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.html',
  styleUrl: './chat.scss',
  imports: [ChatSidebar, ChatWindow],
})
export class Chat implements OnInit {
  private chatService = inject(ChatService);

  protected readonly sidebarCollapsed = signal(false);

  ngOnInit(): void {
    void this.chatService.init();
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((value) => !value);
  }
}
