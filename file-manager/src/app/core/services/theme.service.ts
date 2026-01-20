import { Injectable, signal, effect } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    isDark = signal<boolean>(false);

    constructor() {
        // Check local storage or system preference
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.isDark.set(true);
        }

        // Apply class on change
        effect(() => {
            if (this.isDark()) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    toggle() {
        this.isDark.update(d => !d);
    }
}
