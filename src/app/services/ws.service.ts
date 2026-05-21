import { inject, Injectable, NgZone, signal } from '@angular/core';
import { ApiService } from './api.service';
import { MAX_WS_RECONNECT_ATTEMPTS, WS_PING_INTERVAL_MS, WS_PONG_TIMEOUT_MS } from '../constants';
import { getRetryDelayMs } from '../utils';

export interface WSMessage {
    type: string;
    content?: string;
    sources?: string[];
    messageId: string;
    createdAt: string;
}

export type WSStatus = 'initializing' | 'connecting' | 'online' | 'offline' | 'reconnecting';

@Injectable({
    providedIn: 'root',
})
export class WebSocketService {
    private socket?: WebSocket;

    private readonly api = inject(ApiService);

    private _status = signal<WSStatus>('offline');
    readonly status = this._status.asReadonly();

    private reconnectAttempt = 0;
    private shouldReconnect = true;
    private wsInitInProgress = false;

    private pingTimer?: ReturnType<typeof setInterval>;
    private pongTimer?: ReturnType<typeof setTimeout>;
    private reconnectTimer?: ReturnType<typeof setTimeout>;

    private messageHandler?: (msg: WSMessage) => void;
    private failedSendHandler?: (msg: WSMessage) => void;

    constructor(private zone: NgZone) {}

    connect(sessionId: string, onMessage: (msg: WSMessage) => void, onSendFailed?: (msg: WSMessage) => void): void {
        if (!sessionId) {
            return;
        }

        if (
            this.wsInitInProgress ||
            (this.socket &&
                (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING))
        ) {
            console.log('>>>>> Connection handlers updated');
            this.messageHandler = onMessage;
            this.failedSendHandler = onSendFailed;
            return;
        }

        this.shouldReconnect = true;
        this.wsInitInProgress = true;

        this.cleanup();
        this.clearReconnectTimer();

        this.messageHandler = onMessage;
        this.failedSendHandler = onSendFailed;

        this._status.set('initializing');

        this.api.wsInit(sessionId).subscribe({
            next: (response) => {
                this.wsInitInProgress = false;

                if (!this.shouldReconnect) {
                    this.zone.run(() => {
                        this._status.set('offline');
                    });

                    return;
                }

                this._status.set('connecting');

                this.initSocket(`${response.wsUrl}?X-F2-Auth-Token=${response.token}`, sessionId);
            },
            error: (err) => {
                console.error('>>>>> Socket initialization failed', err);
                this.wsInitInProgress = false;

                this.cleanup();

                if (!this.shouldReconnect) {
                    this.zone.run(() => {
                        this._status.set('offline');
                    });

                    return;
                }

                this.scheduleReconnect(sessionId);
            },
        });
    }

    private initSocket(url: string, sessionId: string) {
        this.zone.runOutsideAngular(() => {
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log('>>>>> Socket Connected');
                this.reconnectAttempt = 0;

                this.zone.run(() => {
                    this._status.set('online');
                });

                this.startHeartbeat();
            };

            this.socket.onmessage = (event: MessageEvent<string>) => {
                let parsed: WSMessage;

                try {
                    parsed = JSON.parse(event.data) as WSMessage;
                } catch (err) {
                    console.error('>>>>> Parse Error', err);
                    return;
                }

                if (parsed.type === 'pong') {
                    this.clearPongTimer();
                    return;
                }

                this.zone.run(() => {
                    this.messageHandler?.(parsed);
                });
            };

            this.socket.onerror = () => {
                console.error('>>>>> Socket Error');
                this.socket?.close();
            };

            this.socket.onclose = () => {
                console.log('>>>>> Socket Closed');
                this.cleanup();

                if (!this.shouldReconnect) {
                    this.zone.run(() => {
                        this._status.set('offline');
                    });

                    return;
                }

                this.scheduleReconnect(sessionId);
            };
        });
    }

    disconnect(): void {
        this.shouldReconnect = false;
        this.wsInitInProgress = false;
        this.reconnectAttempt = 0;
        this.cleanup();
        this.clearReconnectTimer();
        this.socket?.close();
        this.socket = undefined;
        this.messageHandler = undefined;
        this.failedSendHandler = undefined;

        this.zone.run(() => {
            this._status.set('offline');
        });
    }

    send(msg: WSMessage) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(msg));
        } else {
            this.zone.run(() => {
                this.failedSendHandler?.(msg);
            });
        }
    }

    private startHeartbeat(): void {
        this.pingTimer = setInterval(() => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ type: 'ping' }));
                this.startPongTimeout();
            }
        }, WS_PING_INTERVAL_MS);
    }

    private startPongTimeout(): void {
        this.clearPongTimer();

        this.pongTimer = setTimeout(() => {
            console.log('>>>>> No Pong');
            this.socket?.close();
        }, WS_PONG_TIMEOUT_MS);
    }

    private clearPongTimer(): void {
        if (this.pongTimer) {
            clearTimeout(this.pongTimer);
            this.pongTimer = undefined;
        }
    }

    private cleanup(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = undefined;
        }

        this.clearPongTimer();
    }

    private scheduleReconnect(sessionId: string): void {
        this.reconnectAttempt++;

        if (this.reconnectAttempt > MAX_WS_RECONNECT_ATTEMPTS) {
            this.shouldReconnect = false;

            this.zone.run(() => {
                this._status.set('offline');
            });

            return;
        }

        const delay = getRetryDelayMs(this.reconnectAttempt);

        this.zone.run(() => {
            this._status.set('reconnecting');
        });

        this.reconnectTimer = setTimeout(() => {
            if (!this.messageHandler) {
                console.log('>>>>> Suppress reconnecting');

                this.zone.run(() => {
                    this._status.set('offline');
                });

                return;
            }

            this.connect(sessionId, this.messageHandler, this.failedSendHandler);
        }, delay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
    }
}
