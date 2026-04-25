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
    createdAt?: Date;
}
