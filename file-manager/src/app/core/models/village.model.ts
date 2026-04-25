export interface Village {
    id: number;
    name: string;
    talukaId: number;
    talukaName?: string;
    districtName?: string;
    stateName?: string;
    countryName?: string;
    createdAt?: Date;
}
