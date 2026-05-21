import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SessionFeedbackDialogComponent } from '../components/session-feedback-dialog/session-feedback-dialog.component';
import { MessageFeedbackDialogComponent } from '../components/message-feedback-dialog/message-feedback-dialog.component';
import { MessageReportDialogComponent } from '../components/message-report-dialog/message-report-dialog.component';

@Injectable({
    providedIn: 'root',
})
export class DialogService {
    constructor(private dialog: MatDialog) {}

    openSessionFeedbackDialog() {
        return this.dialog.open(SessionFeedbackDialogComponent, {
            width: '500px',
        });
    }

    openMessageFeedbackDialog() {
        return this.dialog.open(MessageFeedbackDialogComponent, {
            width: '500px',
        });
    }

    openMessageReportDialog() {
        return this.dialog.open(MessageReportDialogComponent, {
            width: '500px',
        });
    }
}
