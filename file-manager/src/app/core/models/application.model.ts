export interface Application {
    id?: number;
    visitingDate: string;
    visitorName: string;
    mobileNo: string;
    villageId: number;
    villageName?: string;
    talukaId?: number;
    talukaName?: string;
    districtName?: string;
    stateName?: string;
    countryName?: string;
    description: string;
    reference: string;
    channelId?: number | null;
    channelName?: string;
    followupId?: number | null;
    followupName?: string;
    isCompleted?: boolean;
    isClosed?: boolean;
    assignees?: { id: number; name: string }[];
    assignedToUserIds?: number[];
    createdAt?: Date;
}
