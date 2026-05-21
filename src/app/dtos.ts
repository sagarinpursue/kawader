import { PollMessage } from './services/polling.service';

export interface PollMessagesRequestDTO {
    sessionId: string;
}

export interface PollMessagesResponseDTO {
    messages: PollMessage[];
}

export interface PostMessageFeedbackRequestDTO {
    messageId: string;
    feedbackText?: string;
    feedbackReason: string;
}

export interface PostMessageReportRequestDTO {
    messageId: string;
    reportReason: string;
    reportDetails?: string;
}

export interface SendMessageRequestDTO {
    sessionId: string;
    channelId: string;
    input: string;
}

export interface SendMessageResponseDTO {
    data: string | number;
}

export interface WsInitResponseDTO {
    wsUrl: string;
    token: string;
}
