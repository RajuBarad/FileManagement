import { NgModule } from '@angular/core';
import { LucideAngularModule, HardDrive, Clock, Star, Trash2, Cloud, Plus, Search, Bell, Settings, User, Folder, FolderOpen, File, MoreVertical, Grid, List, Image, FileText, FileSpreadsheet, ChevronDown, ChevronRight, LogOut, ArrowLeft, Save, Share2, Upload, Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp, Users, Lock, RotateCcw, CheckSquare, MessageSquare, Send, Paperclip, UserPlus, Edit2, Loader2, Eye, Music, Video, Code, FileQuestion, Moon, Sun, Menu, UploadCloud, Filter, Ban } from 'lucide-angular';

@NgModule({
    imports: [
        LucideAngularModule.pick({
            HardDrive, Clock, Star, Trash2, Cloud, Plus,
            Search, Bell, Settings, User,
            Folder, FolderOpen, File, MoreVertical, Grid, List,
            Image, FileText, FileSpreadsheet,
            ChevronDown, ChevronRight, LogOut, ArrowLeft, Save, Share2, Upload,
            Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp,
            Users, Lock, RotateCcw, CheckSquare, MessageSquare, Send, Paperclip,
            UserPlus, Edit2, Loader2,
            Eye, Music, Video, Code, FileQuestion,
            Moon, Sun, Menu, UploadCloud, Filter, Ban
        })
    ],
    exports: [
        LucideAngularModule
    ]
})
export class IconsModule { }
