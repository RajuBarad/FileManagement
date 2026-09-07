import { ApplicationConfig, importProvidersFrom, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/guards/auth.interceptor';

import { routes } from './app.routes';
import { LucideAngularModule, HardDrive, Clock, Star, Trash2, Cloud, Plus, Search, Bell, Settings, User, Folder, FolderOpen, FolderPlus, File, MoreVertical, Grid, List, Image, FileText, FileSpreadsheet, ChevronDown, ChevronRight, LogOut, ArrowLeft, Save, Share2, Upload, Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp, Lock, ArrowRight, AlertTriangle, History as HistoryIcon, Filter, Phone, Mail, Key, Eye, EyeOff, Loader2 } from 'lucide-angular';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withHashLocation()),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick({
      HardDrive, Clock, Star, Trash2, Cloud, Plus,
      Search, Bell, Settings, User, Filter,
      Folder, FolderOpen, FolderPlus, File, MoreVertical, Grid, List,
      Image, FileText, FileSpreadsheet,
      ChevronDown, ChevronRight, LogOut, ArrowLeft, Save, Share2, Upload,
      Home, X, Check, Shield, Edit3, Download, ExternalLink, FolderUp, Lock, ArrowRight, AlertTriangle, History: HistoryIcon, history: HistoryIcon,
      Phone, Mail, Key, Eye, EyeOff, Loader2
    })), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
