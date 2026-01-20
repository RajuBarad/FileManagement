export interface Task {
    id: string;
    title: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Review' | 'Completed' | 'Done'; // Handle legacy 'Completed' vs 'Done' consistency
    priority: 'Low' | 'Medium' | 'High';
    dueDate?: Date;
    createdAt: Date;
    assignedToUserId: string;
    assignees?: { id: string; name: string; }[]; // Multiple assignees
    assignedToName?: string; // Legacy/Display
    createdByUserId: string;
    createdByName: string;
    completedAt?: Date;
    updatedAt?: Date;
}

export interface CreateTaskRequest {
    title: string;
    description?: string;
    assignedToUserId: string;
    createdByUserId: string;
    priority?: 'Low' | 'Medium' | 'High';
    dueDate?: string; // YYYY-MM-DD
}
