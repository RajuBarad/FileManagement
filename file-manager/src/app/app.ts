import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/services/toast.service';
import { UploadProgressComponent } from './components/upload-progress/upload-progress.component';
import { NotificationService } from './core/services/notification.service';
import { FilePreviewModalComponent } from './components/modal/file-preview-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, UploadProgressComponent, FilePreviewModalComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('file-manager');
  private notificationService = inject(NotificationService);
}
