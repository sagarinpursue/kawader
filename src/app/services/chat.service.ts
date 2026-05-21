import { ElementRef, inject, Injectable, signal } from '@angular/core';
import { generateUUID } from '../utils';
import { ApiService } from './api.service';
import { DialogService } from './dialog.service';
import { SendMessageRequestDTO, PostMessageFeedbackRequestDTO, PostMessageReportRequestDTO } from '../dtos';
import { SenderType, MessageStatusType, MessageRatingType } from '../enums';
import { environment } from '../../environments/environment';
import { WebSocketService, WSMessage } from './ws.service';
import { CHAT_SCROLL_DELAY_MS, SESSION_FEEDBACK_DIALOG_DELAY_MS, WS_DELTA_TIMEOUT_MS } from '../constants';
import { HttpErrorResponse } from '@angular/common/http';
import { PollingService, PollMessage } from './polling.service';

interface SessionFeedbackDialogResult {
    rating: number;
    feedback: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: SenderType;
    status: MessageStatusType;
    time: Date;
    sources?: string[];
}

interface PredefinedQuestion {
    english: string;
    arabic: string;
}

@Injectable({
    providedIn: 'root',
})
// TODO: [MK] split chat service logic on different classes like messageService, sessionService and so on.
//  This class should contain main properties like isOpen etc., and invoke api methods
export class ChatService {
    userInput = signal<string>('');
    private chatView = signal<'image' | 'content' | 'agent'>('image');
    private isOpen = signal<boolean>(false);
    private chatMessages = signal<ChatMessage[]>([]);
    private chatContainer = signal<ElementRef | null>(null);
    private sessionId = signal<string>('');
    private isSessionFeedbackDialogReady = signal<boolean>(false);

    private sessionFeedbackShown = false;

    private wsFinalTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private feedbackTimeoutId: ReturnType<typeof setTimeout> | null = null;

    private readonly api = inject(ApiService);
    private readonly dialogService = inject(DialogService);
    private readonly wsService = inject(WebSocketService);
    private readonly pollingService = inject(PollingService);

    readonly wsStatus = this.wsService.status;

    private _sessionLoading = signal<boolean>(false);
    readonly sessionLoading = this._sessionLoading.asReadonly();

    private _questions = signal<PredefinedQuestion[]>([]);
    readonly questions = this._questions.asReadonly();

    constructor() {
        window.addEventListener('visibilitychange', () => {
            if (
                !document.hidden &&
                this.getIsOpen() &&
                environment.featureFlags.webSocket &&
                this.wsStatus() !== 'online' &&
                !this.sessionFeedbackShown
            ) {
                console.log('>>>>> WebSocket is offline > Restarting');
                this.openChat(); // [IM] we should restart all. Except a case when feedback shown
            }
        });
    }

    getIsOpen(): boolean {
        return this.isOpen();
    }

    getChatMessages(): ChatMessage[] {
        return this.chatMessages();
    }

    // toggleChat(): void {
    //     this.isOpen.update((prev) => !prev);

    //     if (this.getIsOpen()) {
    //         this.checkNeedOfShowingFeedbackDialog();

    //         if (!this.sessionId()) {
    //             this.startSession();
    //         }

    //         this.connectWebSocket();
    //         this.startPolling();
    //     } else {
    //         this.pollingService.stop();
    //     }
    // }

    toggleChat(): void {
    this.isOpen.update((prev) => !prev);

    if (this.getIsOpen()) {
        this.chatView.set('image'); // 👈 start with image

        this.checkNeedOfShowingFeedbackDialog();

        if (!this.sessionId()) {
            this.startSession();
        }

        this.connectWebSocket();
        this.startPolling();
    } else {
        this.pollingService.stop();
    }
}

    openChat(): void {
        this.isOpen.set(true);
         this.chatView.set('image'); // 👈 important

        this.checkNeedOfShowingFeedbackDialog();

        if (!this.sessionId()) {
            this.startSession();
        }

        this.connectWebSocket();
        this.startPolling();
    }

    closeChat(): void {
        this.isOpen.set(false);

        this.pollingService.stop();
    }

    startSession(): void {
        let sessionId = sessionStorage.getItem('sessionId');

        if (!sessionId) {
            console.log('>>>>> Create New Session and Clean Messages');
            sessionId = generateUUID();
            sessionStorage.setItem('sessionId', sessionId);
            this._sessionLoading.set(true);
            this.api.createSession(sessionId).subscribe({
                next: (response) => this._questions.set(response || []),
                error: (err) => console.error('Error creating session:', err),
                complete: () => this._sessionLoading.set(false),
            });
            this.chatMessages.set([]);
        }

        this.sessionId.set(sessionId);
    }

    private cancelFeedbackTimer(): void {
        if (this.feedbackTimeoutId) {
            clearTimeout(this.feedbackTimeoutId);
            this.feedbackTimeoutId = null;
        }
    }

    setSessionFeedbackDialogTimer() {
        if (!environment.featureFlags.sessionFeedback) {
            return;
        }

        this.cancelFeedbackTimer();

        this.feedbackTimeoutId = setTimeout(() => {
            this.cancelFeedbackTimer();

            if (!this.getIsOpen()) {
                this.isSessionFeedbackDialogReady.set(true);
                return;
            }

            this.showFeedbackDialog();
        }, SESSION_FEEDBACK_DIALOG_DELAY_MS);
    }

    checkNeedOfShowingFeedbackDialog(): void {
        if (this.isSessionFeedbackDialogReady()) {
            this.showFeedbackDialog();
        }
    }

    showFeedbackDialog() {
        this.isSessionFeedbackDialogReady.set(false);

        const _sessionId = this.sessionId();

        if (!_sessionId) {
            console.error('>>>>> Session Broken');
            return;
        }

        sessionStorage.removeItem('sessionId');
        this.sessionId.set('');
        this.unsubscribeAll();

        this.sessionFeedbackShown = true;

        const dialogRef = this.dialogService.openSessionFeedbackDialog();
        dialogRef.afterClosed().subscribe((dialogResult: SessionFeedbackDialogResult | undefined | void) => {
            this.sessionFeedbackShown = false;

            if (dialogResult) {
                this.postSessionRating(_sessionId, dialogResult.rating);

                if (dialogResult.feedback) {
                    this.postSessionFeedback(_sessionId, dialogResult.feedback);
                }
            }

            // call openChat to init new session
            this.openChat();
        });
    }

    isPending(): boolean {
        return (
            !!this.chatMessages().length &&
            this.chatMessages()[this.chatMessages().length - 1].status === MessageStatusType.Pending
        );
    }

    postMessageRating(messageId: string, rating: MessageRatingType): void {
        this.api.postMessageRating(messageId, rating).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: (err) => console.error('Error posting message rating:', err),
        });
    }

    updateMessageRating(messageId: string, rating: MessageRatingType): void {
        this.api.updateMessageRating(messageId, rating).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: (err) => console.error('Error updating message rating:', err),
        });
    }

    deleteMessageRating(messageId: string): void {
        this.api.deleteMessageRating(messageId).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: (err) => console.error('Error deleting message rating:', err),
        });
    }

    postSessionRating(sessionId: string, rating: number): void {
        this.api.postSessionRating(sessionId, rating).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: (err) => console.error('Error posting session rating:', err),
        });
    }

    postSessionFeedback(sessionId: string, feedback: string): void {
        this.api.postSessionFeedback(sessionId, feedback).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: (err) => console.error('Error posting session feedback:', err),
        });
    }

    postMessageFeedback(data: PostMessageFeedbackRequestDTO): void {
        this.api.postMessageFeedback(data).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: (err) => console.error('Error posting message feedback:', err),
        });
    }

    postMessageReport(data: PostMessageReportRequestDTO): void {
        this.api.postMessageReport(data).subscribe({
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            next: () => {},
            error: (err) => console.error('Error posting message report:', err),
        });
    }

    sendMessage(): void {
        if (this.isPending()) {
            return;
        }

        const input = this.userInput().trim();
        if (!input) {
            return;
        }

        if (!this.sessionId()) {
            console.error('Session Id not set');
            return;
        }

        this.userInput.set('');

        const userChatMessage: ChatMessage = {
            id: generateUUID(),
            text: input,
            sender: SenderType.User,
            status: MessageStatusType.Received,
            time: new Date(),
        };
        this.chatMessages.update((prev) => [...prev, userChatMessage]);

        const botChatMessage: ChatMessage = {
            id: generateUUID(),
            text: '',
            sender: SenderType.Bot,
            status: MessageStatusType.Pending,
            time: new Date(),
        };
        this.chatMessages.update((prev) => [...prev, botChatMessage]);

        setTimeout(() => this.scrollToBottom(), CHAT_SCROLL_DELAY_MS);

        const data: SendMessageRequestDTO = {
            sessionId: this.sessionId(),
            channelId: environment.channelId,
            input: input,
        };

        this.api.sendMessage(data).subscribe({
            next: (response) => {
                console.log(response);

                if (!isNaN(new Date(response.data).getTime())) {
                    this.chatMessages.update((currentMessages) => {
                        const updatedMessages = [...currentMessages];
                        updatedMessages[updatedMessages.length - 1].time = new Date(response.data);
                        updatedMessages[updatedMessages.length - 2].time = new Date(response.data);
                        return updatedMessages;
                    });
                }

                this.setSessionFeedbackDialogTimer();
            },
            error: (error: HttpErrorResponse) => {
                if (error.status !== 0) {
                    this.addMessage(MessageStatusType.Error);
                }
            },
        });
    }

    private handlePolledMessages = (messages: PollMessage[]): void => {
        if (!messages.length) {
            return;
        }

        console.log('>>>>> Messages Polled');

        messages.forEach((msg) => {
            const existingIndex = this.chatMessages().findIndex((_msg) => _msg.id === msg.messageId);

            if (existingIndex !== -1) {
                this.chatMessages.update((currentMessages) => {
                    const updatedMessages = [...currentMessages];
                    updatedMessages[existingIndex] = this.buildNewMessage(msg);
                    return updatedMessages;
                });
                return;
            }

            if (
                this.isPending() &&
                new Date(this.chatMessages()[this.chatMessages().length - 1].time) < new Date(msg.createdAt)
            ) {
                this.chatMessages.update((currentMessages) => {
                    return currentMessages.slice(0, currentMessages.length - 1);
                });

                this.setSessionFeedbackDialogTimer();
            }

            this.chatMessages.update((currentMessages) => {
                const updatedMessages = [...currentMessages, this.buildNewMessage(msg)];
                updatedMessages.sort((a, b) => a.time.getTime() - b.time.getTime());
                return updatedMessages;
            });
        });

        setTimeout(() => this.scrollToBottom(), CHAT_SCROLL_DELAY_MS);
    };

    unsubscribeAll(): void {
        console.log('>>>>> Unsubscribe Chat');

        this.cancelFeedbackTimer();
        this.cancelDeltaTimer();
        this.pollingService.stop();
        this.wsService.disconnect();
    }

    private buildNewMessage(msg: PollMessage): ChatMessage {
        return {
            id: msg.messageId,
            text: msg.text
                .replace(/\\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim(),
            sender: SenderType.Bot,
            status: MessageStatusType.Received,
            time: new Date(msg.createdAt),
            sources: msg.sources,
        };
    }

    private startPolling(): void {
        if (!environment.featureFlags.polling) {
            console.log('>>>>> Suppress Polling');
            return;
        }

        if (!this.sessionId()) {
            return;
        }

        this.pollingService.start(this.sessionId(), this.handlePolledMessages);
    }

    private connectWebSocket(): void {
        if (!environment.featureFlags.webSocket) {
            console.log('>>>>> Suppress WebSocket');
            return;
        }

        if (!this.sessionId()) {
            return;
        }

        this.wsService.connect(this.sessionId(), this.handleWsMessage);
    }

    private handleWsMessage = (msg: WSMessage): void => {
        if (!msg.messageId) {
            return;
        }

        if (msg.type === 'complete') {
            this.finalizeWsMessage();
            return;
        }

        if (msg.type !== 'delta') {
            return;
        }

        const deltaText = (msg.content ?? '')
            .replace(/\\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n');
        const createdAt = new Date(msg.createdAt);

        this.setSessionFeedbackDialogTimer();

        this.chatMessages.update((currentMessages) => {
            const existingIndex = currentMessages.findIndex((_msg) => _msg.id === msg.messageId);

            if (existingIndex !== -1) {
                const updatedMessages = [...currentMessages];
                const target = updatedMessages[existingIndex];

                if (target.status === MessageStatusType.Received) {
                    return currentMessages;
                }

                const textToDisplay = (target.text + deltaText)
                    .replace(/\\n/g, '\n')
                    .replace(/\n{3,}/g, '\n\n');

                updatedMessages[existingIndex] = {
                    ...target,
                    text: textToDisplay,
                    time: createdAt,
                    sources: msg.sources || [],
                };

                return updatedMessages;
            }

            const updatedMessages = [...currentMessages];

            if (updatedMessages.length && updatedMessages[updatedMessages.length - 1].status === MessageStatusType.Pending) {
                updatedMessages.pop();
            }

            updatedMessages.push({
                id: msg.messageId,
                text: deltaText,
                sender: SenderType.Bot,
                status: MessageStatusType.Pending,
                time: createdAt,
                sources: msg.sources || [],
            });

            return updatedMessages;
        });

        this.scheduleWsFinalTimeout();

        setTimeout(() => this.scrollToBottom(), CHAT_SCROLL_DELAY_MS);
    };

    private cancelDeltaTimer(): void {
        if (this.wsFinalTimeoutId) {
            clearTimeout(this.wsFinalTimeoutId);
            this.wsFinalTimeoutId = null;
        }
    }

    private scheduleWsFinalTimeout(): void {
        this.cancelDeltaTimer();

        this.wsFinalTimeoutId = setTimeout(() => this.finalizeWsMessage(), WS_DELTA_TIMEOUT_MS);
    }

    private finalizeWsMessage(): void {
        this.cancelDeltaTimer();

        this.chatMessages.update((currentMessages) => {
            const updatedMessages = [...currentMessages];
            updatedMessages[updatedMessages.length - 1].status = MessageStatusType.Received;
            return updatedMessages;
        });
    }

    addMessage(type: MessageStatusType, message?: string) {
        const errorMessage: ChatMessage = {
            id: generateUUID(),
            text: message ?? '',
            sender: SenderType.Bot,
            status: type,
            time: new Date(),
        };

        if (this.isPending()) {
            this.chatMessages.update((currentMessages) => {
                return currentMessages.slice(0, currentMessages.length - 1);
            });
        }

        this.chatMessages.update((currentMessages) => [...currentMessages, errorMessage]);

        setTimeout(() => this.scrollToBottom(), CHAT_SCROLL_DELAY_MS);
    }

    setContainerRef(container: ElementRef): void {
        this.chatContainer.set(container);
    }

    scrollToBottom(): void {
        const container = this.chatContainer();
        if (container?.nativeElement) {
            container.nativeElement.scroll({
                top: container.nativeElement.scrollHeight,
                behavior: 'smooth',
            });
        }
    }

    getChatView() {
    return this.chatView();
    }

    setChatView(view: 'image' | 'content' | 'agent') {
        this.chatView.set(view);
    }
}
