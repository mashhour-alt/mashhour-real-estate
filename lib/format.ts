import type { Project } from "./types";

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

export const projectImages = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=900&q=82",
  "https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=900&q=82",
];

export const imageFor = (project: Project) => {
  const key = `${project["Project Name | اسم المشروع"]}${project["Developer | المطور"]}`;
  const hash = Array.from(key).reduce((total, char) => total + char.charCodeAt(0), 0);
  return projectImages[hash % projectImages.length];
};

export const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const propertyFinderUrl = (project: Project) =>
  `https://www.propertyfinder.ae/en/new-projects/${slugify(project["Developer | المطور"])}/${slugify(project["Project Name | اسم المشروع"])}`;

export const projectImageSrc = (project: Project) =>
  `/api/project-image?url=${encodeURIComponent(propertyFinderUrl(project))}`;

export const projectKey = (project: Project) =>
  `${project["Project Name | اسم المشروع"]}::${project["Developer | المطور"]}`;

export const developerWebsites: Record<string, string> = {
  "Emaar Properties": "https://www.emaar.com/",
  "Sobha Realty": "https://sobharealty.com/",
  Nakheel: "https://www.nakheel.com/",
  Meraas: "https://meraas.com/",
  "Meraas Holding": "https://meraas.com/",
  "Dubai Holding Real Estate": "https://dubaiholding.com/en/real-estate/",
  Omniyat: "https://www.omniyat.com/",
  "Majid Al Futtaim": "https://www.majidalfuttaim.com/",
  "Select Group": "https://www.select-group.ae/",
  "Ellington Properties": "https://ellingtonproperties.ae/",
  Ellington: "https://ellingtonproperties.ae/",
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
  "Mr Eight Development": "https://mreight.ae/",
  Zaya: "https://zaya.com/",
};

export const developerUrl = (name: string) =>
  developerWebsites[name] ||
  `https://www.google.com/search?q=${encodeURIComponent(`${name} official website Dubai developer`)}`;
