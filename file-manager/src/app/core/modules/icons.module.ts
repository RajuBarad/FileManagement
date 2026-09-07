import { NgModule } from '@angular/core';
import { LucideAngularModule, HardDrive, Clock, Star, Trash2, Cloud, Plus, Search, Bell, Settings, User, Folder, FolderOpen, FolderPlus, File, MoreVertical, Grid, List, Image, FileText, FileSpreadsheet, ChevronDown, ChevronRight, ChevronUp, LogOut, ArrowLeft, Save, Share2, Upload, Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp, Users, Lock, RotateCcw, CheckSquare, MessageSquare, Send, Paperclip, UserPlus, Edit2, Loader2, Eye, EyeOff, Key, Music, Video, Code, FileQuestion, Moon, Sun, Menu, UploadCloud, Filter, Ban, Minus, Maximize2, LayoutGrid, Edit, MapPin, Phone, Mail, GripVertical, CheckCircle, Palette, GitFork, ListChecks, Layers, CornerDownRight, AlertTriangle, History } from 'lucide-angular';

@NgModule({
    imports: [
        LucideAngularModule.pick({
            HardDrive, Clock, Star, Trash2, Cloud, Plus,
            Search, Bell, Settings, User,
            Folder, FolderOpen, FolderPlus, File, MoreVertical, Grid, List,
            Image, FileText, FileSpreadsheet,
            ChevronDown, ChevronRight, ChevronUp, LogOut, ArrowLeft, Save, Share2, Upload,
            Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp,
            Users, Lock, RotateCcw, CheckSquare, MessageSquare, Send, Paperclip,
            UserPlus, Edit2, Loader2,
            Eye, EyeOff, Key, Music, Video, Code, FileQuestion,
            Moon, Sun, Menu, UploadCloud, Filter, Ban,
            Minus, Maximize2, LayoutGrid, Edit, MapPin, Phone, Mail, GripVertical, CheckCircle,
            Palette, GitFork, ListChecks, Layers, CornerDownRight, AlertTriangle, History
        })
    ],
    exports: [
        LucideAngularModule
    ]
})
export class IconsModule { }
