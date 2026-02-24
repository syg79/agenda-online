export type Profile = {
    id: string;
    name: string;
    color: string;
};

export type Photographer = {
    id: string;
    name: string;
    color: string;
    type?: string;
    services?: string[];
    neighborhoods?: any;
    latitude?: number | null;
    longitude?: number | null;
    baseAddress?: string | null;
    baseLat?: number | null;
    baseLng?: number | null;
    travelRadius?: number | null;
};

export type Booking = {
    id: string;
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    protocol?: string;
    services: string[];
    address: string;
    neighborhood?: string;
    complement?: string;
    zipCode?: string;
    latitude?: number | null;
    longitude?: number | null;
    status: string;
    date: Date | string;
    time: string;
    duration: number;
    price?: number;
    photographerId?: string | null;
    photographer?: {
        id?: string;
        name: string;
        color: string;
    } | null;
    notes?: string;
    brokerDetails?: string; // field_177 from Tadabase (Name + Phone)
    propertyType?: string;
    city?: string;
};

export type DashboardData = {
    date: string;
    photographers: Photographer[];
    schedule: Booking[];
    pending: Booking[];
    stats: {
        total: number;
        scheduled: number;
        pending: number;
        revenue: number;
    };
};
