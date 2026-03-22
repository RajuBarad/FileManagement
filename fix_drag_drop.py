import sys

filepath = r"e:\YashElectronics\FileManager\FileManagement\file-manager\src\app\features\file-manager\file-manager.component.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update List View Folders
pos = content.find("<!-- Folders -->")
if pos != -1:
    list_folders_pos = content.find("@for (item of folders(); track item.id) {", pos)
    if list_folders_pos != -1:
        tr_pos = content.find("<tr", list_folders_pos)
        end_tr_pos = content.find(">", tr_pos)
        tr_line = content[tr_pos:end_tr_pos+1]
        
        if "draggable" not in tr_line:
            new_tr_line = tr_line.replace('">', '"\n                        [draggable]="true"\n                        (dragstart)="onDragStart($event, item)"\n                        (dragover)="onDragOverFolder($event, item)"\n                        (dragleave)="onDragLeaveFolder($event)"\n                        (drop)="onDropOnFolder($event, item)"\n                        (dragend)="onDragEnd()">')
            content = content[:tr_pos] + new_tr_line + content[end_tr_pos+1:]

# 2. Update List View Files
pos = content.find("<!-- Files -->", pos)
if pos != -1:
    list_files_pos = content.find("@for (item of filesList(); track item.id) {", pos)
    if list_files_pos != -1:
        tr_pos = content.find("<tr", list_files_pos)
        end_tr_pos = content.find(">", tr_pos)
        tr_line = content[tr_pos:end_tr_pos+1]
        
        if "draggable" not in tr_line:
            new_tr_line = tr_line.replace('">', '"\n                        [draggable]="true"\n                        (dragstart)="onDragStart($event, item)"\n                        (dragend)="onDragEnd()">')
            content = content[:tr_pos] + new_tr_line + content[end_tr_pos+1:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Template updated for List View items.")
