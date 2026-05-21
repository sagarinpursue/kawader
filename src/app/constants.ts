export const CHAT_SCROLL_DELAY_MS = 100;
export const CHAT_POLLING_DELAY_MS = 1000 * 60; // 1 minute
export const SESSION_FEEDBACK_DIALOG_DELAY_MS = 1000 * 60 * 5; // 5 minutes

export const WS_PING_INTERVAL_MS = 1000 * 25;
export const WS_PONG_TIMEOUT_MS = 1000 * 8;
export const WS_DELTA_TIMEOUT_MS = 1000 * 10;

export const MAX_POLLING_RETRY_ATTEMPTS = 10;
export const MAX_WS_RECONNECT_ATTEMPTS = 10;

export const MESSAGE_FEEDBACK_REASON_LIST = [
    'not_poorly_personalized',
    'not_factually_correct',
    "didnt_follow_instruction",
    'offensive_unsafe',
    'wrong_language',
    'other',
];

export const MESSAGE_REPORT_REASON_LIST = [
    'hate_speech',
    'sexually_explicit_content',
    'privacy_violation_scams',
    'dangerous_harmful_content',
];
