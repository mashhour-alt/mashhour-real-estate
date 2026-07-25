// Dubai Metro network — public reference coordinates.
// Red and Green are operational; Blue Line is under construction (opening ~2029).
// Coordinates are approximate station centroids, good enough for an overview map.

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
    color: "#e53935",
    status: "operational",
    stations: [
      { name: "Centrepoint", pos: [25.2532, 55.3865] },
      { name: "Etisalat", pos: [25.2626, 55.3742] },
      { name: "Al Qusais", pos: [25.2717, 55.3665] },
      { name: "Dubai Airport Free Zone", pos: [25.2789, 55.3592] },
      { name: "Al Nahda", pos: [25.2884, 55.3486] },
      { name: "Stadium", pos: [25.2793, 55.3452] },
      { name: "Al Qiyadah", pos: [25.2717, 55.3399] },
      { name: "Abu Hail", pos: [25.2792, 55.3315] },
      { name: "Abu Baker Al Siddique", pos: [25.2707, 55.3272] },
      { name: "Salah Al Din", pos: [25.2661, 55.3227] },
      { name: "Union", pos: [25.2653, 55.3157] },
      { name: "BurJuman", pos: [25.2549, 55.3040] },
      { name: "ADCB", pos: [25.2470, 55.2960] },
      { name: "Al Jafiliya", pos: [25.2373, 55.2848] },
      { name: "World Trade Centre", pos: [25.2295, 55.2812] },
      { name: "Emirates Towers", pos: [25.2178, 55.2790] },
      { name: "Financial Centre", pos: [25.2114, 55.2796] },
      { name: "Burj Khalifa / Dubai Mall", pos: [25.2019, 55.2790] },
      { name: "Business Bay", pos: [25.1877, 55.2664] },
      { name: "Noor Bank", pos: [25.1680, 55.2469] },
      { name: "First Abu Dhabi Bank", pos: [25.1548, 55.2318] },
      { name: "Mall of the Emirates", pos: [25.1189, 55.2005] },
      { name: "Sharaf DG", pos: [25.1090, 55.1930] },
      { name: "Dubai Internet City", pos: [25.0967, 55.1745] },
      { name: "Al Khail", pos: [25.0808, 55.1490] },
      { name: "Sobha Realty", pos: [25.0700, 55.1442] },
      { name: "DMCC", pos: [25.0664, 55.1400] },
      { name: "Jabal Ali", pos: [25.0470, 55.1310] },
      { name: "Ibn Battuta", pos: [25.0450, 55.1180] },
      { name: "Energy", pos: [25.0180, 55.1090] },
      { name: "Danube", pos: [25.0010, 55.0990] },
      { name: "UAE Exchange", pos: [24.9930, 55.0910] },
      { name: "Expo 2020", pos: [24.9600, 55.1490] },
    ],
  },
  {
    id: "green",
    name: "Green Line",
    color: "#43a047",
    status: "operational",
    stations: [
      { name: "Etisalat", pos: [25.2626, 55.3742] },
      { name: "Al Qusais", pos: [25.2717, 55.3665] },
      { name: "Dubai Airport T1", pos: [25.2489, 55.3556] },
      { name: "GGICO", pos: [25.2519, 55.3475] },
      { name: "Airport Terminal 3", pos: [25.2469, 55.3535] },
      { name: "Deira City Centre", pos: [25.2525, 55.3320] },
      { name: "Al Rigga", pos: [25.2646, 55.3221] },
      { name: "Union", pos: [25.2653, 55.3157] },
      { name: "Baniyas Square", pos: [25.2678, 55.3050] },
      { name: "Palm Deira", pos: [25.2700, 55.3000] },
      { name: "Al Ras", pos: [25.2690, 55.2940] },
      { name: "Al Ghubaiba", pos: [25.2640, 55.2900] },
      { name: "Sharaf DG / Al Fahidi", pos: [25.2600, 55.2970] },
      { name: "BurJuman", pos: [25.2549, 55.3040] },
      { name: "Oud Metha", pos: [25.2440, 55.3130] },
      { name: "Dubai Healthcare City", pos: [25.2320, 55.3260] },
      { name: "Al Jadaf", pos: [25.2215, 55.3425] },
      { name: "Creek", pos: [25.2170, 55.3350] },
    ],
  },
  {
    id: "blue",
    name: "Blue Line (under construction)",
    color: "#1e88e5",
    status: "construction",
    stations: [
      { name: "Creek Harbour", pos: [25.2068, 55.3458] },
      { name: "Ras Al Khor", pos: [25.1866, 55.3462] },
      { name: "International City 1", pos: [25.1639, 55.4074] },
      { name: "Dubai Silicon Oasis", pos: [25.1221, 55.3773] },
      { name: "Academic City", pos: [25.1300, 55.4100] },
      { name: "International City 2", pos: [25.1550, 55.4250] },
      { name: "Dubai Festival City", pos: [25.2220, 55.3530] },
      { name: "Mirdif", pos: [25.2160, 55.4200] },
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
