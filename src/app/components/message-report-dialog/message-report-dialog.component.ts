import { Component, inject, model, signal } from '@angular/core';
import { DialogService } from '../../services/dialog.service';
import {
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle,
} from '@angular/material/dialog';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MESSAGE_REPORT_REASON_LIST } from '../../constants';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { LanguageService } from '../../services/language.service';
import { ChatStateService } from '../../services/chat-state.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-message-report-dialog',
    imports: [
        MatButton,
        MatDialogActions,
        MatDialogClose,
        MatDialogContent,
        MatDialogTitle,
        MatIcon,
        MatIconButton,
        MatFormField,
        MatInput,
        ReactiveFormsModule,
        FormsModule,
        MatRadioGroup,
        MatRadioButton,
        CommonModule,
    ],
    templateUrl: './message-report-dialog.component.html',
    styleUrl: './message-report-dialog.component.css',
})
export class MessageReportDialogComponent {
    dialogService = inject(DialogService);
    dialogRef = inject(MatDialogRef<MessageReportDialogComponent>);
    private chatState = inject(ChatStateService);
    public language = inject(LanguageService);

    language$ = this.chatState.language$;

    step = signal<number>(1);
    reportReason = model<string>('');
    reportDetails = model<string>('');
    reportReasonList = signal<string[]>(MESSAGE_REPORT_REASON_LIST);

    onCancel(): void {
        this.dialogRef.close();
    }

    nextStep(): void {
        this.step.set(2);
    }

    onSubmit(): void {
        this.dialogRef.close({ reportReason: this.reportReason(), reportDetails: this.reportDetails() });
    }
}
