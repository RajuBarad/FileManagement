export interface Followup {
    id?: number;
    name: string;
    reminderDays: number;
    isDefault?: boolean;
    isCompleted?: boolean;
    sequence?: number;
    createdAt?: Date;
}
