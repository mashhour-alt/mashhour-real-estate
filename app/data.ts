export type Project = {
  "Project Name | اسم المشروع": string;
  "Developer | المطور": string | null;
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
  "Project Source URL | مصدر المشروع"?: string | null;
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
  Tier: string | null;
};

export type PlatformData = { projects: Project[]; developers: Developer[]; areas: Area[] };
export type ProjectAliasMap = Record<string, string>;

export type DldReconciliationReport = {
  reconciledAt: string;
  before: number;
  after: number;
  recordsMerged: number;
  pendingBefore: number;
  pendingAfter: number;
};

export type ProjectEnrichment = {
  verified: boolean;
  verifiedAt: string | null;
  officialName: string;
  community: string;
  unitTypes: string | null;
  officialStartingPrice: number | null;
  overview: string;
  amenities: string[];
  officialSource: string | null;
  videoUrl: string | null;
  coordinates: { lat: number; lng: number } | null;
  quality: string;
};

export type ProjectEnrichmentMap = Record<string, ProjectEnrichment>;

export type ProjectLiveData = {
  sourceProvider: string;
  sourceUpdatedAt: string;
  sourceProjectId: string;
  referenceUrl: string | null;
  title: string;
  developer: string | null;
  developerLogo: string | null;
  images: string[];
  coordinates: { lat: number; lng: number } | null;
  location: string | null;
  amenities: string[];
  bedrooms: string[];
  propertyTypes: string[];
  deliveryDate: string | null;
  startingPrice: number | null;
  priceRange: { min?: number | null; max?: number | null } | null;
  paymentPlans: string[];
  constructionPhase: string | null;
  constructionProgress: number | null;
  stockAvailability: string | null;
  detailUpdatedAt?: string;
  media?: ProjectDetailMedia[];
  brochureUrl?: string | null;
  masterPlanImage?: string | null;
  unitOptions?: ProjectDetailSource["unitOptions"];
  ownershipType?: string | null;
  detailedPaymentPlans?: ProjectDetailSource["paymentPlans"];
};

export type ProjectLiveDataMap = Record<string, ProjectLiveData>;

export type ProjectDetailMedia = {
  url: string;
  preview: string;
  type: string;
};

export type ProjectDetailSource = {
  title: string | null;
  developer: { name?: string; logoUrl?: string } | null;
  location: { fullName?: string; coordinates?: { lat: number; lng?: number; lon?: number } } | null;
  amenities: string[];
  media: ProjectDetailMedia[];
  brochureUrl: string | null;
  masterPlan: { image: string | null } | null;
  paymentPlans: Array<{
    title?: string;
    phases?: Array<{ label?: string; value?: number }>;
  }>;
  propertyTypes: string[];
  deliveryDate: string | null;
  startingPrice: number | null;
  stockAvailability: string | null;
  constructionPhase: string | null;
  constructionProgress: number | null;
  ownershipType: string | null;
  unitOptions: Array<{
    propertyType?: string | null;
    bedrooms?: number;
    areaFrom?: number;
    areaTo?: number;
    bathroomsFrom?: number;
    bathroomsTo?: number;
    startingPrice?: number;
    layouts?: Array<{
      layoutType?: string;
      area?: number;
      bathrooms?: number;
      bedrooms?: number;
      floorPlans?: string[];
    }>;
  }>;
};

export const money = (value: number | null) =>
  value
    ? new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency: "AED",
        maximumFractionDigits: 0,
      }).format(value)
    : "On request";

export const areaFrom = (value: string | null) => {
  if (!value) return "Dubai";
  const parts = value.split(",").map((item) => item.trim()).filter(Boolean);
  return parts[1] || parts[0] || "Dubai";
};

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const isDldLinked = (project: Project) =>
  Boolean(project["Project Source URL | مصدر المشروع"]?.includes("dubailand.gov.ae"));

export const constructionProgressFromRecord = (project: Project) => {
  const match = project["Unit Type | نوع الوحدة"]?.match(/construction progress:\s*(\d+(?:\.\d+)?)%/i);
  return match ? Number(match[1]) : null;
};

export const projectImages = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=82",
];

export const imageFor = (project: Project) => {
  const key = `${project["Project Name | اسم المشروع"]}${project["Developer | المطور"]}`;
  const hash = Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0);
  return projectImages[hash % projectImages.length];
};

export const developerWebsites: Record<string, string> = {
  "Emaar Properties": "https://www.emaar.com/",
  "Sobha Realty": "https://sobharealty.com/",
  Nakheel: "https://www.nakheel.com/",
  Meraas: "https://meraas.com/",
  "Meraas Holding": "https://meraas.com/",
  Omniyat: "https://www.omniyat.com/",
  "Select Group": "https://www.select-group.ae/",
  "Ellington Properties": "https://ellingtonproperties.ae/",
  "Damac Properties": "https://www.damacproperties.com/",
  "Azizi Developments": "https://www.azizidevelopments.com/",
  "Binghatti Developers": "https://www.binghatti.com/",
  "Imtiaz Developments": "https://imtiaz.ae/",
  "Aldar Properties PJSC": "https://www.aldar.com/",
  ARADA: "https://www.arada.com/",
  Nshama: "https://nshama.ae/",
  "Samana Developers": "https://www.samanadevelopers.com/",
  "Object 1": "https://object-1.com/",
  "Danube Properties": "https://danubeproperties.com/",
};

export const developerUrl = (name: string | null) => {
  if (!name) return "";
  if (developerWebsites[name]) return developerWebsites[name];
  const normalized = name.toLowerCase();
  if (normalized.includes("emaar")) return "https://www.emaar.com/";
  if (normalized.includes("damac")) return "https://www.damacproperties.com/";
  if (normalized.includes("azizi")) return "https://www.azizidevelopments.com/";
  if (normalized.includes("sobha")) return "https://sobharealty.com/";
  if (normalized.includes("ellington")) return "https://ellingtonproperties.ae/";
  if (normalized.includes("binghatti")) return "https://www.binghatti.com/";
  if (normalized.includes("meraas")) return "https://meraas.com/";
  if (normalized.includes("nakheel")) return "https://www.nakheel.com/";
  if (normalized.includes("imtiaz")) return "https://imtiaz.ae/";
  if (normalized.includes("nshama")) return "https://nshama.ae/";
  if (normalized.includes("object 1") || normalized.includes("object one")) return "https://object-1.com/";
  return "";
};
