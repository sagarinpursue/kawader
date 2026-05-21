import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import {
    SendMessageRequestDTO,
    PollMessagesResponseDTO,
    SendMessageResponseDTO,
    PostMessageFeedbackRequestDTO,
    PollMessagesRequestDTO,
    PostMessageReportRequestDTO,
    WsInitResponseDTO,
} from '../dtos';
import { MessageRatingType } from '../enums';

@Injectable({
    providedIn: 'root',
})
export class ApiService {
    private readonly http = inject(HttpClient);
    private readonly API_KEY = environment.apiKey;
    private readonly API_URL = environment.apiGatewayUrl;
    private readonly CHANNEL_ID = environment.channelId;

    sendMessage(data: SendMessageRequestDTO): Observable<SendMessageResponseDTO> {
        return this.http.post<SendMessageResponseDTO>(`${this.API_URL}/web-integration`, data, {
            headers: {
                'x-api-key': this.API_KEY,
            },
        });
    }

    pollMessages(data: PollMessagesRequestDTO): Observable<PollMessagesResponseDTO> {
        return this.http.get<PollMessagesResponseDTO>(`${this.API_URL}/messages-poll`, {
            headers: {
                'x-api-key': this.API_KEY,
            },
            params: {
                sessionId: data.sessionId,
            },
        });
    }

    wsInit(sessionId: string): Observable<WsInitResponseDTO> {
        return this.http.post<WsInitResponseDTO>(
            `${this.API_URL}/ws-init`,
            { sessionId },
            {
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    postMessageRating(messageId: string, rating: MessageRatingType): Observable<any> {
        return this.http.post<any>(
            `${this.API_URL}/chat_messages/rating`,
            {
                rating: rating,
                chat_message_id: messageId,
            },
            {
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    updateMessageRating(messageId: string, rating: MessageRatingType): Observable<any> {
        return this.http.patch<any>(
            `${this.API_URL}/chat_messages/rating`,
            { rating },
            {
                params: {
                    chat_message_id: `eq.${messageId}`,
                },
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    deleteMessageRating(messageId: string): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/chat_messages/rating`, {
            params: {
                chat_message_id: `eq.${messageId}`,
            },
            headers: {
                'x-api-key': this.API_KEY,
            },
        });
    }

    postSessionRating(sessionId: string, rating: number): Observable<any> {
        return this.http.post<any>(
            `${this.API_URL}/chat_sessions/rating`,
            {
                rating: rating,
                chat_session_id: sessionId,
            },
            {
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    postSessionFeedback(sessionId: string, feedback: string): Observable<any> {
        return this.http.post<any>(
            `${this.API_URL}/chat_sessions/feedback`,
            {
                feedback_text: feedback,
                chat_session_id: sessionId,
            },
            {
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    postMessageFeedback(data: PostMessageFeedbackRequestDTO): Observable<any> {
        return this.http.post<any>(
            `${this.API_URL}/chat_messages/feedback`,
            {
                chat_message_id: data.messageId,
                feedback_text: data.feedbackText,
                feedback_reason: data.feedbackReason,
            },
            {
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    postMessageReport(data: PostMessageReportRequestDTO): Observable<any> {
        return this.http.post<any>(
            `${this.API_URL}/chat_messages/report`,
            {
                report_reason: data.reportReason,
                report_details: data.reportDetails,
                chat_message_id: data.messageId,
            },
            {
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }

    createSession(sessionId: string) {
        return this.http.post<any>(
            `${this.API_URL}/session`,
            {
                channelId: this.CHANNEL_ID,
                sessionId: sessionId,
            },
            {
                headers: {
                    'x-api-key': this.API_KEY,
                    'Content-Type': 'application/json',
                },
            },
        );
    }
}
