import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { MatIconButton } from '@angular/material/button';
import { LanguageService } from '../../services/language.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-chat-toggle',
    standalone: true,
    imports: [MatIconButton, CommonModule],
    templateUrl: './chat-toggle.component.html',
    styleUrl: './chat-toggle.component.css',
})
export class ChatToggleComponent {
    private chatService = inject(ChatService);
    public language = inject(LanguageService); 
    private chatState = inject(ChatStateService);
    
    language$ = this.chatState.language$;

    onToggleChat() {
        this.chatService.toggleChat();
    }
}
