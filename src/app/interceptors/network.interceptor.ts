import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { fromEvent, throwError, catchError, take } from 'rxjs';
import { ChatService } from '../services/chat.service';
import { MessageStatusType } from '../enums';

let isWaitingForOnline = false;

export const networkInterceptor: HttpInterceptorFn = (req, next) => {
    const chatService = inject(ChatService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 0) {
                chatService.addMessage(MessageStatusType.Error,'Network error, try again later');
                chatService.unsubscribeAll();

                if (!isWaitingForOnline) {
                    isWaitingForOnline = true;

                    fromEvent(window, 'online')
                        .pipe(take(1))
                        .subscribe(() => {
                            chatService.addMessage(MessageStatusType.System, 'Network restored');
                            if (chatService.getIsOpen()) {
                                chatService.openChat();
                            }
                            isWaitingForOnline = false;
                        });
                }
            }

            return throwError(() => error);
        }),
    );
};
