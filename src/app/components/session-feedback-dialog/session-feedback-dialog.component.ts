import { Component, inject, model, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { ChatStateService } from '../../services/chat-state.service';
import { LanguageService } from '../../services/language.service';

@Component({
    selector: 'app-feedback-dialog',
    templateUrl: './session-feedback-dialog.component.html',
    styleUrls: ['./session-feedback-dialog.component.css'],
    standalone: true,
    imports: [MatDialogModule, MatButtonModule, MatRadioModule, MatInputModule, FormsModule, CommonModule, MatIcon],
})
export class SessionFeedbackDialogComponent {
    rating = model<number>(0);
    feedback = model<string>('');
    step = signal<number>(1);

    private chatState = inject(ChatStateService);
    public language = inject(LanguageService);

    language$ = this.chatState.language$;
    
    constructor(public dialogRef: MatDialogRef<SessionFeedbackDialogComponent>) {}

    onCancel(): void {
        this.dialogRef.close();
    }

    nextStep(): void {
        if (this.rating() <= 3) {
            this.step.set(2);
        } else {
            this.onSubmit();
        }
    }

    onSubmit(): void {
        this.dialogRef.close({ rating: this.rating(), feedback: this.feedback() });
    }
}
