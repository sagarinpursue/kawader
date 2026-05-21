import { Component } from '@angular/core';
import { ContainerComponent } from './components/container/container.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [ContainerComponent],
    template: `<app-container></app-container>`,
})
export class AppComponent {}
