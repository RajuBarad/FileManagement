const fs = require('fs');
const path = require('path');

const filepath = "e:\\YashElectronics\\FileManager\\FileManagement\\file-manager\\src\\app\\features\\file-manager\\file-manager.component.ts";

let content = fs.readFileSync(filepath, 'utf-8');

// 1. Update List View Folders
let pos = content.indexOf("<!-- Folders -->");
if (pos !== -1) {
    let list_folders_pos = content.indexOf("@for (item of folders(); track item.id) {", pos);
    if (list_folders_pos !== -1) {
        let tr_pos = content.indexOf("<tr", list_folders_pos);
        let end_tr_pos = content.indexOf(">", tr_pos);
        let tr_line = content.substring(tr_pos, end_tr_pos + 1);
        
        if (!tr_line.includes("draggable")) {
            let new_tr_line = tr_line.replace('">', '"\n                        [draggable]="true"\n                        (dragstart)="onDragStart($event, item)"\n                        (dragover)="onDragOverFolder($event, item)"\n                        (dragleave)="onDragLeaveFolder($event)"\n                        (drop)="onDropOnFolder($event, item)"\n                        (dragend)="onDragEnd()">');
            content = content.substring(0, tr_pos) + new_tr_line + content.substring(end_tr_pos + 1);
        }
    }
}

// 2. Update List View Files
pos = content.indexOf("<!-- Files -->", pos);
if (pos !== -1) {
    let list_files_pos = content.indexOf("@for (item of filesList(); track item.id) {", pos);
    if (list_files_pos !== -1) {
        let tr_pos = content.indexOf("<tr", list_files_pos);
        let end_tr_pos = content.indexOf(">", tr_pos);
        let tr_line = content.substring(tr_pos, end_tr_pos + 1);
        
        if (!tr_line.includes("draggable")) {
            let new_tr_line = tr_line.replace('">', '"\n                        [draggable]="true"\n                        (dragstart)="onDragStart($event, item)"\n                        (dragend)="onDragEnd()">');
            content = content.substring(0, tr_pos) + new_tr_line + content.substring(end_tr_pos + 1);
        }
    }
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Template updated for List View items.");
