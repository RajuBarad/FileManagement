import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent, ToastService } from './core/services/toast.service';
import { UploadProgressComponent } from './components/upload-progress/upload-progress.component';
import { NotificationService } from './core/services/notification.service';
import { FilePreviewModalComponent } from './components/modal/file-preview-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, UploadProgressComponent, FilePreviewModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('file-manager');
  private notificationService = inject(NotificationService);
  private toastService = inject(ToastService);

  ngOnInit() {
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));
  }

  private updateOnlineStatus(isOnline: boolean) {
    if (isOnline) {
      this.toastService.show('You are back online', 'success');
    } else {
      this.toastService.show('You are offline. Some features may be unavailable.', 'error');
    }
  }
}
