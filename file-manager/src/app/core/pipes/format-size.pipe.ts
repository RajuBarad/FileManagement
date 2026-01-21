import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatSize',
    standalone: true
})
export class FormatSizePipe implements PipeTransform {
    transform(bytes: number | string | undefined | null, isFolder = false): string {
        if (isFolder) return '-';
        if (bytes === undefined || bytes === null || bytes === '') return '0 B';

        const numBytes = Number(bytes);
        if (isNaN(numBytes) || numBytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(numBytes) / Math.log(k));
        return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
