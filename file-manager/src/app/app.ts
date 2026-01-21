import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './core/services/toast.service';
import { UploadProgressComponent } from './components/upload-progress/upload-progress.component';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent, UploadProgressComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('file-manager');
  private notificationService = inject(NotificationService);
}
