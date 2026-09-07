export interface ModuleOperation {
  key: string;
  label: string;
  icon?: string;
}

export interface ModulePermission {
  moduleKey: string;
  moduleName?: string;
  category?: 'Core' | 'Masters' | string;
  description?: string;
  availableOperations?: ModuleOperation[];
  operations?: Record<string, boolean>;
  canView: boolean;
  canAdd: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export type PermissionAction = 'view' | 'add' | 'update' | 'delete' | string;

export interface UserPermissionsResponse {
  status: string;
  user: {
    id: number | string;
    name: string;
    role: string;
    isAdmin: boolean;
  };
  permissions: ModulePermission[];
}

export interface MyPermissionsResponse {
  status: string;
  userId: number | string;
  isAdmin: boolean;
  permissions: Record<string, Record<string, boolean>>;
}
