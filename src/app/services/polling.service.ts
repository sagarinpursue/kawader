import { inject, Injectable, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from './api.service';
import { CHAT_POLLING_DELAY_MS, MAX_POLLING_RETRY_ATTEMPTS } from '../constants';
import { HttpErrorResponse } from '@angular/common/http';
import { getRetryDelayMs } from '../utils';

export interface PollMessage {
    text: string;
    from: string;
    sources: string[];
    messageId: string;
    createdAt: string;
}

export type PollStatus = 'connecting' | 'online' | 'offline' | 'reconnecting';

@Injectable({
    providedIn: 'root',
})
export class PollingService {
    private _status = signal<PollStatus>('offline');
    readonly status = this._status.asReadonly();

    private pollingSubscription: Subscription | null = null;
    private pollTimeoutId: ReturnType<typeof setTimeout> | null = null;

    private sessionId: string | null = null;

    private retryAttempt = 0;

    private onMessages: ((messages: PollMessage[]) => void) | null = null;

    private readonly api = inject(ApiService);

    start(sessionId: string, onMessages: (messages: PollMessage[]) => void): void {
        if (!sessionId) {
            return;
        }

        const alreadyRunning = this.sessionId === sessionId && this.isRunning();

        if (alreadyRunning) {
            console.log('>>>>> Polling handler updated');
            this.onMessages = onMessages;
            return;
        }

        this.sessionId = sessionId;
        this.onMessages = onMessages;

        this._status.set('connecting');

        this.clearPolling();
        this.pollLoop();
    }

    stop(): void {
        this.retryAttempt = 0;
        this._status.set('offline');
        this.clearPolling();
        this.sessionId = null;
        this.onMessages = null;
    }

    isRunning(): boolean {
        return !!this.pollingSubscription && !this.pollingSubscription.closed;
    }

    private shouldRetry(error: HttpErrorResponse): boolean {
        return (error.status === 0 || error.status >= 500) && this.retryAttempt <= MAX_POLLING_RETRY_ATTEMPTS;
    }

    private clearPolling(): void {
        this.clearNextPoll();

        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = null;
        }
    }

    private clearNextPoll(): void {
        if (this.pollTimeoutId) {
            clearTimeout(this.pollTimeoutId);
            this.pollTimeoutId = null;
        }
    }

    private pollLoop(): void {
        if (!this.sessionId) {
            return;
        }

        const data = {
            sessionId: this.sessionId,
        };

        this.pollingSubscription?.unsubscribe();
        this.pollingSubscription = this.api.pollMessages(data).subscribe({
            next: (response) => {
                this._status.set('online');
                this.retryAttempt = 0;

                const messages = response.messages || [];

                if (messages.length) {
                    this.onMessages?.(messages);
                }

                this.clearNextPoll();
                this.pollTimeoutId = setTimeout(() => this.pollLoop(), CHAT_POLLING_DELAY_MS);
            },
            error: (error: HttpErrorResponse) => {
                console.error('Error in polling:', error);

                if (!this.shouldRetry(error)) {
                    this.stop();
                    return;
                }

                this.retryAttempt++;
                this._status.set('reconnecting');
                const delay = getRetryDelayMs(this.retryAttempt);
                this.clearNextPoll();
                this.pollTimeoutId = setTimeout(() => this.pollLoop(), delay);
            },
        });
    }
}
