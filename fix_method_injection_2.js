const fs = require('fs');

const filepath = "e:\\YashElectronics\\FileManager\\FileManagement\\file-manager\\src\\app\\features\\file-manager\\file-manager.component.ts";

let content = fs.readFileSync(filepath, 'utf-8');

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

const regex = /^\s*renameSelectedItem\(\)\s*\{/m;

if (!content.includes("openMoveDialog() {") && regex.test(content)) {
    content = content.replace(regex, methodStr);
    console.log("openMoveDialog method injected successfully using regex definition check.");
} else {
    console.log("Method 'openMoveDialog() {' already exists or renameSelectedItem not found using regex.");
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Injection Fix 2 Executed.");
