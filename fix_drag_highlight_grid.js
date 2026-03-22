const fs = require('fs');

const filepath = "e:\\YashElectronics\\FileManager\\FileManagement\\file-manager\\src\\app\\features\\file-manager\\file-manager.component.ts";

let content = fs.readFileSync(filepath, 'utf-8');

// Regex to match the parent div of Grid View Folders
// It must contain `<div` followed by classes and `(dragover)="onDragOverFolder($event, item)"`
const regexGridParent = /<div\s+class="group bg-white[^>]*\([\s\S]*?dragover\)="onDragOverFolder\(\$event,\s*item\)"[\s\S]*?>/m;

if (regexGridParent.test(content)) {
    let match = content.match(regexGridParent)[0];
    
    // 1. Move `(dblclick)="onItemClick(item)"` if it's not already there
    if (!match.includes("(dblclick)")) {
        let newMatch = match.replace(">", "\n                     (dblclick)=\"onItemClick(item)\">");
        content = content.replace(match, newMatch);
        console.log("Moved dblclick to Grid parent div.");
    }
    
    // 2. Add pointer-events-none to children div
    const searchInner = '<div class="flex items-center gap-3 flex-1 min-w-0" (dblclick)="onItemClick(item)">';
    const replaceInner = '<div class="flex items-center gap-3 flex-1 min-w-0 pointer-events-none">';
    
    if (content.includes(searchInner)) {
        content = content.replace(searchInner, replaceInner);
        console.log("Grid View Folder items updated with pointer-events-none.");
    } else {
        console.log("Inner div not found for Grid View Folder.");
    }
} else {
    console.log("Grid parent div not matched using regex.");
}

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Grid highlight fixes completed.");
