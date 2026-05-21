export function generateUUID(): string {
    return crypto.randomUUID();
}

export function getRetryDelayMs(retryAttempt: number): number {
    const base = Math.min(1000 * 2 ** retryAttempt, 30000);
    const jitter = Math.floor(base * 0.2 * Math.random());
    return base + jitter;
}
