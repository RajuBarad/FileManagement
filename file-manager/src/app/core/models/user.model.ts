export type UserRole = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    password?: string; // In real app, never store plain text. Here we simulation.
    name: string;
    role: UserRole;
    avatar?: string;
}
