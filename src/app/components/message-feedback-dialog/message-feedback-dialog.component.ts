import { Component, inject, model, signal } from '@angular/core';
import {
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MESSAGE_FEEDBACK_REASON_LIST } from '../../constants';
import { LanguageService } from '../../services/language.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-message-feedback-dialog',
    imports: [
        MatButton,
        MatDialogActions,
        MatDialogContent,
        MatDialogTitle,
        MatFormField,
        MatInput,
        FormsModule,
        MatIconModule,
        MatIconButton,
        MatDialogClose,
        CommonModule,
    ],
    templateUrl: './message-feedback-dialog.component.html',
    styleUrl: './message-feedback-dialog.component.css',
})
export class MessageFeedbackDialogComponent {
    step = signal<number>(1);
    feedbackReasonList = signal(MESSAGE_FEEDBACK_REASON_LIST);
    private chatState = inject(ChatStateService);
    public language = inject(LanguageService);

    language$ = this.chatState.language$;


    feedbackReason = signal<string>('');
    feedbackText = model<string>('');

    // TODO: change to inject
    constructor(public dialogRef: MatDialogRef<MessageFeedbackDialogComponent>) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    nextStep(): void {
        if (this.feedbackReason() === 'Other') {
            this.step.set(2);
        } else {
            this.onSubmit();
        }
    }

    onSubmit(): void {
        this.dialogRef.close({ feedbackReason: this.feedbackReason(), feedbackText: this.feedbackText() });
    }
}
