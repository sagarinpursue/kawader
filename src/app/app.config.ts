import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { networkInterceptor } from './interceptors/network.interceptor';
import { provideMarkdown } from 'ngx-markdown';
import { provideRouter } from '@angular/router';

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideHttpClient(withInterceptors([networkInterceptor])),
        provideAnimationsAsync(),
        provideMarkdown(),
        provideRouter([]),
    ],
};
