const fs = require('fs');

const filepath = "e:\\YashElectronics\\FileManager\\FileManagement\\file-manager\\src\\app\\features\\file-manager\\file-manager.component.ts";

let content = fs.readFileSync(filepath, 'utf-8');

// 1. Grid View Folders
// Move `(dblclick)` to parent, add `pointer-events-none` to children container

const gridFolderSearch = `<div class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm transition cursor-pointer flex items-center justify-between p-3 relative"
                     [draggable]="true"
                     (dragstart)="onDragStart($event, item)"
                     (dragover)="onDragOverFolder($event, item)"
                     (dragleave)="onDragLeaveFolder($event)"
                     (drop)="onDropOnFolder($event, item)"
                     (dragend)="onDragEnd()"
                     (contextmenu)="$event.preventDefault(); openContextMenu($event, item)">`;

const gridFolderReplace = `<div class="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm transition cursor-pointer flex items-center justify-between p-3 relative"
                     [draggable]="true"
                     (dragstart)="onDragStart($event, item)"
                     (dragover)="onDragOverFolder($event, item)"
                     (dragleave)="onDragLeaveFolder($event)"
                     (drop)="onDropOnFolder($event, item)"
                     (dragend)="onDragEnd()"
                     (dblclick)="onItemClick(item)"
                     (contextmenu)="$event.preventDefault(); openContextMenu($event, item)">`;

// Preemptive replace for dblclick shift
if (content.includes(gridFolderSearch)) {
    content = content.replace(gridFolderSearch, gridFolderReplace);
    content = content.replace('<div class="flex items-center gap-3 flex-1 min-w-0" (dblclick)="onItemClick(item)">', '<div class="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">');
    console.log("Grid View Folder updated with dblclick shift and pointer-events-none.");
}

// 2. List View Folders (Update rows if needed, rows already have dblclick on <tr> itself!)
// Wait, in List view, the <tr> has (dblclick).
// Lines 246 area:
// `<tr (dblclick)="onItemClick(item)" ...>`
// All children live inside the rows.
// I can just add `pointer-events-none` to the folder item element containing Name and Icon to prevent flicker.
// Let's look for:
// `<div class="flex items-center gap-3">` inside List View Folders section.

let pos = content.indexOf("<!-- Folders -->");
if (pos !== -1) {
    let list_folders_pos = content.indexOf("@for (item of folders(); track item.id) {", pos);
    if (list_folders_pos !== -1) {
        let div_pos = content.indexOf('<div class="flex items-center gap-3">', list_folders_pos);
        if (div_pos !== -1 && div_pos < content.indexOf('<!-- Files -->', list_folders_pos)) {
            content = content.substring(0, div_pos) + '<div class="flex items-center gap-3 pointer-events-none">' + content.substring(div_pos + '<div class="flex items-center gap-3">'.length);
            console.log("List View Folder item container updated with pointer-events-none.");
        }
    }
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Template updated for highlight flicker prevention.");
