import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { FileSystemService } from '../../core/services/file-system.service';
import { FormatSizePipe } from '../../core/pipes/format-size.pipe';
import { ToastService } from '../../core/services/toast.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-version-history-dialog',
  standalone: true,
  imports: [CommonModule, FormatSizePipe],
  templateUrl: './version-history-dialog.html',
  styleUrl: './version-history-dialog.css'
})
export class VersionHistoryDialogComponent implements OnInit {
  versions$!: Observable<any[]>;

  constructor(
    @Inject(DIALOG_DATA) public data: { fileId: string, fileName: string },
    public dialogRef: DialogRef,
    private fileSystem: FileSystemService,
    private toast: ToastService
  ) { }

  ngOnInit() {
    this.versions$ = this.fileSystem.getVersions(this.data.fileId).pipe(
      catchError(err => {
        console.error('Version History Error:', err);
        this.toast.show('Failed to load version history', 'error');
        return of([]);
      })
    );
  }

  restore(version: any) {
    if (!confirm(`Are you sure you want to restore version ${version.versionNumber}? This will archive the current version.`)) return;

    this.fileSystem.restoreVersion(version.id).subscribe({
      next: () => {
        this.toast.show('File restored successfully', 'success');
        this.dialogRef.close(true); // Return success to trigger refresh
      },
      error: () => this.toast.show('Failed to restore file', 'error')
    });
  }

  close() {
    this.dialogRef.close();
  }
}
