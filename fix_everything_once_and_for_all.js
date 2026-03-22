const fs = require('fs');

const filepath = "e:\\YashElectronics\\FileManager\\FileManagement\\file-manager\\src\\app\\features\\file-manager\\file-manager.component.ts";

let content = fs.readFileSync(filepath, 'utf-8');

// 1. Fix line 4: Remove accidental duplicate from cdk/dialog
content = content.replace(/Dialog,\s*DialogModule,\s*MoveDialogComponent\s*}/, "Dialog, DialogModule }");

// 2. Ensure Correct Import at the top (Line 17 is already there confirmed)
if (!content.includes("MoveDialogComponent") && !content.includes("../../components/move-dialog/")) {
    console.log("Adding MoveDialogComponent import.");
    content = content.replace("import { VersionHistoryDialogComponent }", "import { MoveDialogComponent } from '../../components/move-dialog/move-dialog.component';\nimport { VersionHistoryDialogComponent }");
}

// 3. Add to `@Component` imports array
if (content.includes("imports: [") && !content.includes("MoveDialogComponent\n") && !content.includes("MoveDialogComponent,")) {
    const importsIdx = content.indexOf("imports: [");
    const endImportsIdx = content.indexOf("]", importsIdx);
    const importsContent = content.substring(importsIdx, endImportsIdx);
    
    if (importsContent.includes("DialogModule")) {
        content = content.replace("DialogModule", "DialogModule,\n    MoveDialogComponent");
        console.log("Added MoveDialogComponent to @Component imports array.");
    }
}

// 4. Inject openMoveDialog method inside class
const methodStr = `
  openMoveDialog() {
    const item = this.selectedItem();
    if (!item) return;

    this.closeContextMenu();

    const dialogRef = this.dialog.open<string | null>(MoveDialogComponent, {
      data: {
        itemId: item.id,
        itemName: item.name,
        parentId: item.parentId
      }
    });

    dialogRef.closed.subscribe(targetFolderId => {
      if (targetFolderId !== undefined) { 
        this.fileService.moveItem(item.id, targetFolderId).subscribe({
          next: () => {
            this.toast.show('Item moved successfully', 'success');
            this.loadItems(this.fileService.currentFolderId());
          }
        });
      }
    });
  }

  renameSelectedItem() {`;

// Look for renameSelectedItem and replace it ONLY IF openMoveDialog is missing
if (!content.includes("openMoveDialog()") && content.includes("renameSelectedItem() {")) {
    content = content.replace("renameSelectedItem() {", methodStr);
    console.log("openMoveDialog method injected.");
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Compilation Fix Tool Executed.");
