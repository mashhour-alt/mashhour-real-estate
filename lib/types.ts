export type Project = {
  "Project Name | اسم المشروع": string;
  "Developer | المطور": string;
  "Segment | القطاع": string | null;
  "Unit Type | نوع الوحدة": string | null;
  "Location / Community | المنطقة": string | null;
  "Handover | التسليم": string | null;
  "Starting Price AED | السعر المبدئي": number | null;
  "Booking % | الحجز": number | null;
  "During Construction % | أثناء الإنشاء": number | null;
  "At Handover % | عند التسليم": number | null;
  "Escrow Account Status | حالة حساب الضمان": string | null;
  "Data Status | حالة البيانات": string | null;
};

export type Developer = {
  Developer: string;
  Tier: string | null;
  "Overall /10": number | null;
  "Delivery /10": number | null;
  "Quality /10": number | null;
  "Safety /10": number | null;
};

export type Area = {
  Area: string;
  Segment: string;
  "Asset Type": string;
  "PSF Benchmark": number | null;
  "Gross Yield": number | null;
  "Demand /10": number | null;
  "Appreciation p.a."?: number | null;
  Tier: string | null;
};

export type Data = {
  projects: Project[];
  developers: Developer[];
  areas: Area[];
};

export type Lang = "en" | "ar" | "it";
