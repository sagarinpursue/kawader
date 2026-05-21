import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'cutSource',
})
export class CutSourcePipe implements PipeTransform {
    transform(value?: string | null): string {
        if (!value) {
            return '';
        }

        if (value.length <= 100) {
            return value;
        }

        return value.slice(0, 50) + '...' + value.slice(-50);
    }
}
