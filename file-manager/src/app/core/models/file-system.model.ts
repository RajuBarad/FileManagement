export type FileType = 'folder' | 'image' | 'pdf' | 'doc' | 'sheet' | 'text' | 'unknown';

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedByName?: string;
  type: FileType;
  size?: number;
  lastModified: Date;
  content?: string | ArrayBuffer | Blob; // content for mock
  url?: string; // for display
  path?: string;

  // New fields for ownership and sharing
  ownerId: string;
  ownerName?: string;
  sharedWith: string[]; // List of User IDs
  accessType?: 'Owned' | 'Shared';
  isShared?: boolean;

  // Lock Properties
  isLocked?: boolean;
  lockedByUserId?: number;
  lockedByUserName?: string;
  lockedOn?: string;

  // Star Property
  isStarred?: boolean;
}

export const MOCK_FILES: FileSystemItem[] = [
  { id: '1', parentId: null, name: 'Documents', type: 'folder', lastModified: new Date(), ownerId: 'admin-id', sharedWith: [] },
  { id: '2', parentId: null, name: 'Images', type: 'folder', lastModified: new Date(), ownerId: 'admin-id', sharedWith: [] },
  { id: '3', parentId: '1', name: 'Resume.docx', type: 'doc', size: 1024, lastModified: new Date(), ownerId: 'admin-id', sharedWith: [] },
  { id: '4', parentId: '2', name: 'Vacation.jpg', type: 'image', size: 2048, lastModified: new Date(), url: 'assets/mock-image.jpg', ownerId: 'admin-id', sharedWith: [] }
];
