// Dubai Metro network — reference coordinates for an overview map.
// Red and Green are operational; Blue Line is under construction (opening ~2029).
// Station coordinates are ordered along each line and kept approximate; the goal
// is a clean, readable overview, not survey-grade rail geometry.

export type MetroStation = { name: string; pos: [number, number] };
export type MetroLine = {
  id: string;
  name: string;
  color: string;
  status: "operational" | "construction";
  stations: MetroStation[];
};

export const METRO_LINES: MetroLine[] = [
  {
    id: "red",
    name: "Red Line",
    color: "#e2231a",
    status: "operational",
    // Ordered north-east (Centrepoint / Rashidiya) → south-west (Expo / UAE Exchange).
    stations: [
      { name: "Rashidiya", pos: [25.2470, 55.3985] },
      { name: "Emirates", pos: [25.2455, 55.3870] },
      { name: "Airport Terminal 3", pos: [25.2478, 55.3630] },
      { name: "Airport Terminal 1", pos: [25.2510, 55.3520] },
      { name: "GGICO", pos: [25.2530, 55.3400] },
      { name: "Deira City Centre", pos: [25.2530, 55.3320] },
      { name: "Al Rigga", pos: [25.2640, 55.3235] },
      { name: "Union", pos: [25.2660, 55.3160] },
      { name: "BurJuman", pos: [25.2545, 55.3040] },
      { name: "ADCB", pos: [25.2455, 55.2955] },
      { name: "Max / World Trade Centre", pos: [25.2295, 55.2820] },
      { name: "Emirates Towers", pos: [25.2175, 55.2790] },
      { name: "Financial Centre", pos: [25.2115, 55.2800] },
      { name: "Burj Khalifa / Dubai Mall", pos: [25.2030, 55.2795] },
      { name: "Business Bay", pos: [25.1865, 55.2660] },
      { name: "Noor Bank", pos: [25.1680, 55.2470] },
      { name: "First Abu Dhabi Bank", pos: [25.1490, 55.2300] },
      { name: "Mall of the Emirates", pos: [25.1190, 55.2005] },
      { name: "Mashreq", pos: [25.1090, 55.1930] },
      { name: "Dubai Internet City", pos: [25.0985, 55.1745] },
      { name: "Al Khail", pos: [25.0870, 55.1560] },
      { name: "Sobha Realty", pos: [25.0760, 55.1440] },
      { name: "DMCC", pos: [25.0670, 55.1400] },
      { name: "Nakheel", pos: [25.0640, 55.1370] },
      { name: "Ibn Battuta", pos: [25.0445, 55.1185] },
      { name: "Energy", pos: [25.0180, 55.1090] },
      { name: "Danube", pos: [25.0010, 55.0985] },
      { name: "UAE Exchange", pos: [24.9930, 55.0910] },
    ],
  },
  {
    id: "green",
    name: "Green Line",
    color: "#00954c",
    status: "operational",
    // Ordered north (Etisalat) → south (Creek), following the loop through Deira.
    stations: [
      { name: "Etisalat", pos: [25.2810, 55.3720] },
      { name: "Al Qusais", pos: [25.2790, 55.3620] },
      { name: "Dubai Airport Free Zone", pos: [25.2770, 55.3530] },
      { name: "Al Nahda", pos: [25.2740, 55.3450] },
      { name: "Stadium", pos: [25.2720, 55.3400] },
      { name: "Al Qiyadah", pos: [25.2695, 55.3360] },
      { name: "Abu Hail", pos: [25.2790, 55.3310] },
      { name: "Abu Baker Al Siddique", pos: [25.2710, 55.3270] },
      { name: "Salah Al Din", pos: [25.2660, 55.3230] },
      { name: "Union", pos: [25.2660, 55.3160] },
      { name: "Baniyas Square", pos: [25.2680, 55.3040] },
      { name: "Palm Deira", pos: [25.2720, 55.2990] },
      { name: "Al Ras", pos: [25.2690, 55.2945] },
      { name: "Al Ghubaiba", pos: [25.2635, 55.2920] },
      { name: "Al Fahidi", pos: [25.2600, 55.2985] },
      { name: "BurJuman", pos: [25.2545, 55.3040] },
      { name: "Oud Metha", pos: [25.2440, 55.3130] },
      { name: "Dubai Healthcare City", pos: [25.2320, 55.3255] },
      { name: "Al Jadaf", pos: [25.2215, 55.3410] },
      { name: "Creek", pos: [25.2170, 55.3350] },
    ],
  },
  {
    id: "blue",
    name: "Blue Line (under construction)",
    color: "#0072ce",
    // Announced alignment; opening ~2029. Kept as a simple indicative corridor.
    status: "construction",
    stations: [
      { name: "Creek Harbour (interchange)", pos: [25.2068, 55.3458] },
      { name: "Ras Al Khor", pos: [25.1870, 55.3560] },
      { name: "International City 1", pos: [25.1660, 55.3980] },
      { name: "International City 2", pos: [25.1620, 55.4150] },
      { name: "Dubai Silicon Oasis", pos: [25.1250, 55.3850] },
      { name: "Academic City", pos: [25.1300, 55.4050] },
    ],
  },
];

// Major landmarks — giant/iconic projects. `construction: true` renders faded.
export type Landmark = {
  name: string;
  pos: [number, number];
  construction?: boolean;
};

export const LANDMARKS: Landmark[] = [
  { name: "Burj Khalifa", pos: [25.1972, 55.2744] },
  { name: "Palm Jumeirah", pos: [25.1124, 55.1390] },
  { name: "Burj Al Arab", pos: [25.1412, 55.1853] },
  { name: "Dubai Mall", pos: [25.1975, 55.2796] },
  { name: "Museum of the Future", pos: [25.2196, 55.2820] },
  { name: "Ain Dubai", pos: [25.0790, 55.1200] },
  { name: "Dubai Frame", pos: [25.2354, 55.3003] },
  { name: "Expo City Dubai", pos: [24.9600, 55.1490] },
  { name: "Palm Jebel Ali", pos: [25.0100, 55.0100], construction: true },
  { name: "Dubai Creek Tower", pos: [25.2010, 55.3470], construction: true },
  { name: "Al Maktoum Intl Airport", pos: [24.8967, 55.1614], construction: true },
  { name: "Dubai Islands", pos: [25.2922, 55.3272], construction: true },
];
