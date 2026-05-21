import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { WebSocketService, WSStatus } from '../../services/ws.service';
import { PollingService, PollStatus } from '../../services/polling.service';
import { environment } from '../../../environments/environment';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LanguageService } from '../../services/language.service';


@Component({
    selector: 'app-header',
    standalone: true,
    imports: [MatIconModule, MatButtonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
})
export class HeaderComponent {
    private chatService = inject(ChatService);
    private wsService = inject(WebSocketService);
    private pollingService = inject(PollingService);
    public language = inject(LanguageService);
    
    readonly featureFlags = environment.featureFlags;
    readonly wsStatus = this.wsService.status;
    readonly pollingStatus = this.pollingService.status;

    closeChat() {
        this.chatService.closeChat();
    }

    statusLabel(status: WSStatus | PollStatus): string {
        switch (status) {
            case 'online':
                return 'Online';
            case 'offline':
                return 'Offline';
            case 'initializing':
                return 'Initializing...';
            case 'connecting':
                return 'Connecting...';
            case 'reconnecting':
                return 'Reconnecting...';
            default:
                return 'Offline';
        }
    }

    statusValueClass(status: WSStatus | PollStatus): string {
        switch (status) {
            case 'online':
                return 'status-online';
            case 'offline':
                return 'status-offline';
            default:
                return 'status-warning';
        }
    }
}
