export type AreaGuide = {
  slug: string;
  aliases: string[];
  image: string;
  eyebrow: string;
  intro: string;
  location: string;
  roads: string[];
  neighbours: string[];
  developer: string;
  infrastructure: string;
  future: string;
  lat: number;
  lng: number;
};

export function areaSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const AREA_GUIDES: AreaGuide[] = [
  {
    slug: "downtown-dubai",
    aliases: ["Downtown Dubai", "Downtown"],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "ICONIC CORE",
    intro: "Dubai's landmark urban core, combining globally recognised destinations, premium residences, hospitality and direct access to the city's central business districts.",
    location: "Downtown Dubai sits at the heart of the city beside Business Bay and Sheikh Zayed Road, centred around Burj Khalifa and Dubai Mall.",
    roads: ["Sheikh Zayed Road", "Financial Centre Road", "Al Khail Road"],
    neighbours: ["Business Bay", "DIFC", "City Walk"],
    developer: "Emaar is the principal master developer associated with Downtown Dubai, alongside a wider mix of hospitality and residential operators.",
    infrastructure: "The district combines metro access, major road connections, retail, hospitality, pedestrian destinations and established urban services.",
    future: "Downtown remains one of Dubai's most established global destination districts. Future value is closely linked to continued investment in central Dubai, tourism, hospitality, mobility and surrounding mixed-use districts.",
    lat: 25.1972,
    lng: 55.2744
  },
  {
    slug: "dubai-marina",
    aliases: ["Dubai Marina", "Marina"],
    image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "WATERFRONT LIVING",
    intro: "A mature waterfront district built around the marina promenade, high-rise residences, hospitality and direct access to Dubai's coastal lifestyle.",
    location: "Dubai Marina occupies a strategic coastal position close to JBR, Dubai Harbour and Sheikh Zayed Road.",
    roads: ["Sheikh Zayed Road", "Al Marsa Street", "King Salman Bin Abdulaziz Al Saud Street"],
    neighbours: ["JBR", "Dubai Harbour", "Jumeirah Lakes Towers"],
    developer: "Emaar developed the original marina masterplan, with projects from numerous major Dubai developers now forming the wider district.",
    infrastructure: "Dubai Marina benefits from Dubai Metro and Tram connectivity, established retail, schools nearby, restaurants, beaches, marinas and mature public infrastructure.",
    future: "The area is already mature, so its evolution is driven primarily by surrounding waterfront development, transport connectivity, hospitality and continued investment around Dubai Harbour and the wider coastal corridor.",
    lat: 25.0805,
    lng: 55.1403
  },
  {
    slug: "business-bay",
    aliases: ["Business Bay"],
    image: "https://images.unsplash.com/photo-1526495124232-a04e1849168c?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "CENTRAL DISTRICT",
    intro: "A high-density mixed-use district beside Downtown Dubai combining residential towers, offices, hotels and the Dubai Water Canal.",
    location: "Business Bay sits immediately south of Downtown Dubai with access toward Sheikh Zayed Road and Al Khail Road.",
    roads: ["Sheikh Zayed Road", "Al Khail Road", "Al A'amal Street"],
    neighbours: ["Downtown Dubai", "DIFC", "Meydan"],
    developer: "Dubai Properties has historically played a major role in the district, while many private developers operate individual projects throughout Business Bay.",
    infrastructure: "The area combines metro access, canal-side public realm, hotels, offices, retail and strong road connectivity into central Dubai.",
    future: "Business Bay continues to evolve as part of Dubai's central urban core, with new premium residential, hospitality and mixed-use development reinforcing its connection with Downtown and the canal.",
    lat: 25.1867,
    lng: 55.2631
  },
  {
    slug: "dubai-hills-estate",
    aliases: ["Dubai Hills Estate", "Dubai Hills"],
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "GREEN MASTERPLAN",
    intro: "A large master-planned community centred on green space, family housing, Dubai Hills Mall and a growing collection of premium residential projects.",
    location: "Dubai Hills Estate occupies a central inland position between Downtown Dubai and Dubai Marina with access to Al Khail Road.",
    roads: ["Al Khail Road", "Umm Suqeim Street"],
    neighbours: ["Al Barsha", "Mohammed Bin Rashid City", "Dubai Science Park"],
    developer: "Dubai Hills Estate is a joint master development associated with Emaar and Meraas.",
    infrastructure: "The community includes Dubai Hills Mall, schools, healthcare, parks, cycling and walking environments, golf facilities and established road connections.",
    future: "Its long-term position is linked to continued completion of the masterplan, transport improvements and Dubai's expansion of high-quality family-oriented communities in central locations.",
    lat: 25.1136,
    lng: 55.2475
  },
  {
    slug: "dubai-creek-harbour",
    aliases: ["Dubai Creek Harbour", "Creek Harbour"],
    image: "https://images.unsplash.com/photo-1546412414-e1885259563a?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "NEW WATERFRONT",
    intro: "A major waterfront master community on Dubai Creek designed around residences, promenades, open space and views toward the city's skyline.",
    location: "Dubai Creek Harbour lies along Dubai Creek, northeast of Downtown Dubai and close to Ras Al Khor Wildlife Sanctuary.",
    roads: ["Ras Al Khor Road", "Nad Al Hamar Road"],
    neighbours: ["Ras Al Khor", "Dubai Festival City", "Meydan"],
    developer: "Emaar is the principal developer associated with Dubai Creek Harbour.",
    infrastructure: "The masterplan combines waterfront promenades, residential districts, hospitality, retail and road connections with significant future development capacity.",
    future: "The district remains a long-term growth area. Its evolution is tied to phased masterplan delivery, waterfront activation and broader transport and urban development across the Dubai Creek corridor.",
    lat: 25.2056,
    lng: 55.3442
  },
  {
    slug: "palm-jumeirah",
    aliases: ["Palm Jumeirah", "The Palm Jumeirah"],
    image: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "GLOBAL WATERFRONT",
    intro: "Dubai's globally recognised man-made island, combining beachfront residences, branded homes, resorts and destination hospitality.",
    location: "Palm Jumeirah extends into the Arabian Gulf from Dubai's coastal corridor between Dubai Marina and Al Sufouh.",
    roads: ["Palm Jumeirah Road", "King Salman Bin Abdulaziz Al Saud Street", "Sheikh Zayed Road"],
    neighbours: ["Dubai Harbour", "Dubai Marina", "Al Sufouh"],
    developer: "Nakheel is the master developer behind Palm Jumeirah, with a wide range of international hospitality brands and residential developers operating on the island.",
    infrastructure: "The Palm combines road and monorail connectivity, beaches, hotels, restaurants, retail, marinas and mature luxury residential infrastructure.",
    future: "As an established luxury destination, future positioning is driven by continued redevelopment, branded residences, premium hospitality and investment across Dubai's wider coastal corridor.",
    lat: 25.1124,
    lng: 55.1390
  },
  {
    slug: "jumeirah-village-circle",
    aliases: ["Jumeirah Village Circle", "JVC"],
    image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "CONNECTED COMMUNITY",
    intro: "A centrally positioned residential community with apartments, townhouses, parks and a large pipeline of new residential development.",
    location: "Jumeirah Village Circle sits between Sheikh Mohammed Bin Zayed Road and Al Khail Road, with access toward Dubai Marina and central Dubai.",
    roads: ["Al Khail Road", "Sheikh Mohammed Bin Zayed Road", "Hessa Street"],
    neighbours: ["Jumeirah Village Triangle", "Dubai Sports City", "Arjan"],
    developer: "Nakheel is the master developer of Jumeirah Village Circle, while a large number of private developers deliver individual residential projects.",
    infrastructure: "JVC includes community parks, schools, retail, Circle Mall and established road infrastructure, with services continuing to expand alongside population growth.",
    future: "The district's development trajectory is linked to infill construction, improving community services and transport connectivity across Dubai's expanding central residential belt.",
    lat: 25.0531,
    lng: 55.2088
  },
  {
    slug: "dubai-south",
    aliases: ["Dubai South"],
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1800&q=85",
    eyebrow: "FUTURE GROWTH CORRIDOR",
    intro: "A major southern Dubai development zone positioned around aviation, logistics, new residential communities and the wider expansion around Al Maktoum International Airport.",
    location: "Dubai South is located in southern Dubai around Al Maktoum International Airport and close to Expo City Dubai.",
    roads: ["Emirates Road", "Sheikh Mohammed Bin Zayed Road", "Expo Road"],
    neighbours: ["Expo City Dubai", "Dubai Investment Park", "Jebel Ali"],
    developer: "Dubai South is a government-backed master development with multiple residential and commercial developers operating within its districts.",
    infrastructure: "The area is planned around aviation, logistics, residential communities, commercial districts and major regional road infrastructure.",
    future: "Dubai South is one of the city's major long-term growth corridors, with its outlook strongly connected to airport expansion, Expo City, logistics and continued development of southern Dubai.",
    lat: 24.8965,
    lng: 55.1614
  }
];

export function getAreaGuide(areaName: string): AreaGuide {
  const normalized = areaName.toLowerCase().trim();
  const exact = AREA_GUIDES.find((guide) =>
    guide.aliases.some((alias) => alias.toLowerCase() === normalized)
  );

  if (exact) return exact;

  return {
    slug: areaSlug(areaName),
    aliases: [areaName],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1800&q=82",
    eyebrow: "DUBAI AREA GUIDE",
    intro: `${areaName} is part of Dubai's evolving property market. This guide connects the area's market benchmarks with location context and currently available projects.`,
    location: `${areaName} forms part of Dubai's wider urban network. Exact accessibility depends on the individual project location within the community.`,
    roads: ["Dubai road network", "Local community access"],
    neighbours: ["Dubai"],
    developer: "Development in this area may include multiple master developers and private developers. Check the individual project page for project-level developer information.",
    infrastructure: "Infrastructure and community services vary by sub-community and project location. Project pages provide the most specific property-level context.",
    future: "Future development should be assessed using confirmed masterplan delivery, transport improvements and official planning announcements rather than projections alone.",
    lat: 25.2048,
    lng: 55.2708
  };
}

export function getAreaBySlug(slug: string, areaNames: string[]) {
  const matchedName = areaNames.find((name) => areaSlug(name) === slug);
  if (!matchedName) return null;
  return {
    name: matchedName,
    guide: getAreaGuide(matchedName)
  };
}
