const fs = require('fs');

const filepath = "e:\\YashElectronics\\FileManager\\FileManagement\\file-manager\\src\\app\\features\\file-manager\\file-manager.component.ts";

let content = fs.readFileSync(filepath, 'utf-8');

// 1. Add Import
const importStr = "import { MoveDialogComponent } from '../../components/move-dialog/move-dialog.component';\n";
if (!content.includes("MoveDialogComponent")) {
    // Insert after VersionHistoryDialogComponent import
    const searchIdx = content.indexOf("import { VersionHistoryDialogComponent }");
    if (searchIdx !== -1) {
        const endLineIdx = content.indexOf("\n", searchIdx);
        content = content.substring(0, endLineIdx + 1) + importStr + content.substring(endLineIdx + 1);
    }
}

// 2. Add to imports array
if (content.includes("imports: [") && !content.includes("MoveDialogComponent\n") && !content.includes("MoveDialogComponent,")) {
    const importsIdx = content.indexOf("imports: [");
    const endImportsIdx = content.indexOf("]", importsIdx);
    const importsContent = content.substring(importsIdx, endImportsIdx);
    
    // Add inside after DialogueModule or similar
    if (importsContent.includes("DialogModule")) {
        content = content.replace("DialogModule", "DialogModule,\n    MoveDialogComponent");
    }
}

// 3. Add openMoveDialog method
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

if (!content.includes("openMoveDialog()")) {
    if (content.includes("renameSelectedItem() {")) {
        content = content.replace("renameSelectedItem() {", methodStr);
    }
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Imports and method added to FileManagerComponent.");
