import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LayoutService {
    isMobileSidebarOpen = signal(false);
    isChatOpen = signal(false);

    toggleSidebar() {
        this.isMobileSidebarOpen.update(v => !v);
    }

    closeSidebar() {
        this.isMobileSidebarOpen.set(false);
    }

    toggleChat() {
        this.isChatOpen.update(v => !v);
    }

    closeChat() {
        this.isChatOpen.set(false);
    }
}
