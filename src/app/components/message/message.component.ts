import { Component, inject, input, signal } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { SenderType, MessageStatusType, MessageRatingType } from '../../enums';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { DialogService } from '../../services/dialog.service';
import { CutSourcePipe } from '../../pipes/cut-source.pipe';
import { MarkdownComponent } from 'ngx-markdown';

interface MessageFeedbackDialogResult {
    feedbackText: string;
    feedbackReason: string;
}

interface MessageReportDialogResult {
    reportReason: string;
    reportDetails: string;
}

@Component({
    selector: 'app-message',
    standalone: true,
    imports: [MarkdownComponent, MatCard, MatCardContent, TypingIndicatorComponent, MatIcon, MatIconButton, CutSourcePipe],
    templateUrl: './message.component.html',
    styleUrl: './message.component.css',
})
export class MessageComponent {
    private chatService = inject(ChatService);
    private dialogService = inject(DialogService);

    isReported = signal<boolean>(false);

    message = input.required<ChatMessage>();
    rating = signal<MessageRatingType>(MessageRatingType.None);

    protected readonly MessageStatusType = MessageStatusType;
    protected readonly MessageRatingType = MessageRatingType;
    protected readonly SenderType = SenderType;

    isSourcesExpanded = signal(false);

    formatTime(date: Date) {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
    }

    toggleSources() {
        this.isSourcesExpanded.update((prev) => !prev);
    }

    thumbUp() {
        this.rateMessage(MessageRatingType.ThumbUp);
    }

    thumbDown() {
        this.rateMessage(MessageRatingType.ThumbDown);

        if (this.rating() === MessageRatingType.ThumbDown) {
            const dialogRef = this.dialogService.openMessageFeedbackDialog();
            dialogRef.afterClosed().subscribe((dialogResult: MessageFeedbackDialogResult | undefined | void) => {
                if (dialogResult) {
                    this.chatService.postMessageFeedback({
                        messageId: this.message().id,
                        feedbackText: dialogResult.feedbackText,
                        feedbackReason: dialogResult.feedbackReason,
                    });
                }
            });
        }
    }

    rateMessage(newRating: MessageRatingType) {
        const currentRating = this.rating();

        if (currentRating === newRating) {
            this.rating.set(MessageRatingType.None);
            this.chatService.deleteMessageRating(this.message().id);
        } else if (currentRating === MessageRatingType.None) {
            this.rating.set(newRating);
            this.chatService.postMessageRating(this.message().id, newRating);
        } else {
            this.rating.set(newRating);
            this.chatService.updateMessageRating(this.message().id, newRating);
        }
    }

    report() {
        if (this.isReported()) {
            // TODO [MK]: should we delete report?
            this.isReported.set(false);
            return;
        }

        const dialogRef = this.dialogService.openMessageReportDialog();
        dialogRef.afterClosed().subscribe((dialogResult: MessageReportDialogResult | undefined | void) => {
            if (dialogResult) {
                this.chatService.postMessageReport({
                    messageId: this.message().id,
                    reportDetails: dialogResult.reportDetails,
                    reportReason: dialogResult.reportReason,
                });

                this.isReported.set(true);
            }
        });
    }
}
