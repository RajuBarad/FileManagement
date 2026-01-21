import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { LucideAngularModule, HardDrive, Clock, Star, Trash2, Cloud, Plus, Search, Bell, Settings, User, Folder, FolderOpen, File, MoreVertical, Grid, List, Image, FileText, FileSpreadsheet, ChevronDown, ChevronRight, LogOut, ArrowLeft, Save, Share2, Upload, Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp, Lock, ArrowRight, AlertTriangle, History as HistoryIcon, Filter } from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch()),
    importProvidersFrom(LucideAngularModule.pick({
      HardDrive, Clock, Star, Trash2, Cloud, Plus,
      Search, Bell, Settings, User, Filter,
      Folder, FolderOpen, File, MoreVertical, Grid, List,
      Image, FileText, FileSpreadsheet,
      ChevronDown, ChevronRight, LogOut, ArrowLeft, Save, Share2, Upload,
      Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp, Lock, ArrowRight, AlertTriangle, History: HistoryIcon, history: HistoryIcon
    }))
  ]
};
