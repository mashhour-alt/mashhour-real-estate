import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const platformPath = path.join(root, "public/data/offplan.json");
const outputPath = path.join(root, "public/data/project-live-data.json");
const baseUrl = "https://www.propertyfinder.ae/en/new-projects/lp/dubai";
const headers = {
  "accept": "text/html,application/json",
  "accept-language": "en-AE,en;q=0.9",
  "user-agent": "MashhourRealEstate/1.0 (+https://mashhour-real-estate.fanoproperti-2866.chatgpt.site)",
};

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const normalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(the|at|by)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const strictNormalize = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const basicTokens = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .match(/[a-z0-9]+/g) || [];

const numberWords = new Map([
  ["one", "1"],
  ["two", "2"],
  ["three", "3"],
  ["four", "4"],
  ["five", "5"],
  ["six", "6"],
  ["seven", "7"],
  ["eight", "8"],
  ["nine", "9"],
  ["ten", "10"],
  ["eleven", "11"],
  ["twelve", "12"],
  ["i", "1"],
  ["ii", "2"],
  ["iii", "3"],
  ["iv", "4"],
  ["v", "5"],
  ["vi", "6"],
  ["vii", "7"],
  ["viii", "8"],
  ["ix", "9"],
  ["x", "10"],
]);

const developerGenericTokens = new Set([
  "real", "estate", "development", "developments", "developer", "developers",
  "property", "properties", "holding", "holdings", "group", "limited", "llc",
  "l", "c", "pjsc", "p", "j", "s", "fze", "soc", "branch", "of", "and",
  "dubai", "dwc", "company", "co", "owned", "person",
]);

const projectGenericTokens = new Set([
  "the", "at", "by", "phase", "project", "residences", "residence",
  "residential", "tower", "towers", "building", "buildings", "apartment",
  "apartments", "villas", "villa", "homes", "home", "hotel", "hotels",
  "collection", "development", "developments", "properties", "property",
  "real", "estate", "dubai", "uae", "llc", "l", "c", "pjsc", "p", "j",
  "s", "fze", "soc", "branch", "of", "for", "and",
]);

const normalizeDeveloper = (value = "") =>
  basicTokens(value)
    .filter((token) => !developerGenericTokens.has(token) && !/^\d+$/.test(token))
    .join(" ");

const developersRelated = (left, right) => {
  const a = normalizeDeveloper(left);
  const b = normalizeDeveloper(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  return overlap >= Math.min(aTokens.size, bTokens.size);
};

const canonicalProjectName = (value = "", developer = "") => {
  const developerTokens = new Set(
    basicTokens(developer).filter((token) => !developerGenericTokens.has(token)),
  );
  return basicTokens(value)
    .filter((token) => !projectGenericTokens.has(token) && !developerTokens.has(token))
    .map((token) => numberWords.get(token) || token)
    .map((token) => ({
      ln: "lane",
      jaddaf: "jadaf",
      dell: "del",
    }[token] || token))
    .join(" ");
};

const normalizeLocation = (value = "") =>
  strictNormalize(value)
    .replace(/\bdlrc\b/g, "dubai land residence complex")
    .replace(/\bmadinat dubai almelaheyah\b/g, "dubai maritime city")
    .replace(/\bmadinat al mataar\b/g, "dubai south")
    .replace(/\bpalm deira\b/g, "dubai islands")
    .replace(/\bmarsa dubai\b/g, "dubai marina")
    .replace(/\bal hebiah second\b/g, "dubai studio city")
    .replace(/\bal hebiah fourth\b/g, "dubai sports city")
    .replace(/\bal hebiah sixth\b/g, "mudon")
    .replace(/\bnad al shiba\b/g, "nad al sheba");

const locationsRelated = (left, right) => {
  const ignored = new Set(["dubai", "united", "arab", "emirates", "project"]);
  const a = new Set(normalizeLocation(left).split(" ").filter((token) => token.length > 3 && !ignored.has(token)));
  const b = new Set(normalizeLocation(right).split(" ").filter((token) => token.length > 3 && !ignored.has(token)));
  return [...a].some((token) => b.has(token));
};

const sourceUrlKey = (value = "") => {
  try {
    const pathname = new URL(
      String(value),
      "https://www.propertyfinder.ae",
    ).pathname.replace(/\/+$/, "");
    return pathname.startsWith("/en/new-projects/") ? pathname : "";
  } catch {
    return "";
  }
};

// Reviewed aliases for legal DLD names whose public project page uses a different
// marketing title. Keeping these explicit prevents a fuzzy match from choosing a
// similarly named project by the wrong developer.
const verifiedSourceAliases = new Map([
  ["Skyhills Residences 1", "/en/new-projects/hre-development/skyhills-residences"],
  ["Beverly Residence 2", "/en/new-projects/h-m-b-development/beverly-residence-2"],
  ["Lincoln Star Residence III by Wyndham", "/en/new-projects/lincoln-star-real-estate-development/lincoln-star-residence-3"],
  ["Portside 2 by Samana Developers", "/en/new-projects/samana-developers/samana-portside-2"],
  ["Portside by Samana Developers", "/en/new-projects/samana-developers/samana-portside"],
  ["DAMAC ISLANDS 2 - BAHAMAS 1", "/en/new-projects/damac-properties/bahamas"],
  ["DAMAC ISLANDS 2 - BAHAMAS 2", "/en/new-projects/damac-properties/bahamas-phase-2"],
  ["DAMAC ISLANDS 2 - BERMUDA", "/en/new-projects/damac-properties/bermuda"],
  ["DAMAC ISLANDS 2 - BARBADOS 1", "/en/new-projects/damac-properties/barbados"],
  ["DAMAC ISLANDS 2 - BARBADOS 2", "/en/new-projects/damac-properties/barbados-2"],
  ["DAMAC ISLANDS 2 - TAHITI 2", "/en/new-projects/damac-properties/tahiti-2"],
  ["Trump Tower", "/en/new-projects/dar-global/trump-international-hotel-and-tower-dubai"],
  ["The Oasis - Palmiera Collective", "/en/new-projects/emaar-properties/palmiera-collective"],
  ["Nami Island Project", "/en/new-projects/nami-island-development/nami-island-villas"],
  ["SERA 1", "/en/new-projects/emaar-properties/sera-by-emaar"],
  ["SERA 2", "/en/new-projects/emaar-properties/sera-phase-2-by-emaar"],
  ["The Valley - Alva", "/en/new-projects/emaar-properties/alva-the-valley"],
  ["The Valley - Alva 2", "/en/new-projects/emaar-properties/alva-2-at-the-valley"],
  ["The Valley - Alva 3", "/en/new-projects/emaar-properties/alva-3-the-valley"],
  ["S'VN RESIDENCES", "/en/new-projects/metrical-real-estate-development/svn-residences"],
  ["Coventry Curve", "/en/new-projects/gfs-developers/coventry-curves"],
  ["Cove Edition Residence 1 By Imtiaz", "/en/new-projects/imtiaz-developments/cove-edition"],
  ["Beachfront Gates 1", "/en/new-projects/dubai-south/beachfront-gates-1"],
  ["REEF 1000", "/en/new-projects/reef-luxury-development/reef-1000"],
  ["EVERGRIN HOUSE", "/en/new-projects/object-1-contemporary-development/evergr1n-house"],
  ["Binghatti Skyflame 1", "/en/new-projects/binghatti-developers/binghatti-skyflame"],
]);

// These legal DLD names have tempting but unverified marketing-name neighbours.
// Keep them searchable without a pin until an authoritative project coordinate
// can be tied to the exact legal record.
const blockedAutomaticMatches = new Set([
  "Celesto Two",
  "Orchid Residence 1",
  "Cresswell Homes",
  "Cresswell Views II",
  "RAW DISTRICT BY IMTIAZ R",
]);

const numbersIn = (value) => strictNormalize(value).match(/\d+/g) || [];
const hasDistinctiveCanonicalName = (value) =>
  value
    .split(" ")
    .some((token) => /[a-z]/.test(token) && token.length >= 3);

const levenshtein = (left, right) => {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let column = 1; column <= right.length; column += 1) {
    let previous = rows[0];
    rows[0] = column;
    for (let row = 1; row <= left.length; row += 1) {
      const current = rows[row];
      rows[row] = Math.min(
        rows[row] + 1,
        rows[row - 1] + 1,
        previous + (left[row - 1] === right[column - 1] ? 0 : 1),
      );
      previous = current;
    }
  }
  return rows[left.length];
};

const similarity = (left, right) => {
  if (!left || !right) return 0;
  return 1 - levenshtein(left, right) / Math.max(left.length, right.length);
};

const tokenSimilarity = (left, right) => {
  const a = new Set(strictNormalize(left).split(" ").filter((item) => item.length > 1));
  const b = new Set(strictNormalize(right).split(" ").filter((item) => item.length > 1));
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
};

const cleanProjectName = (value = "") =>
  String(value)
    .replace(/\s+[—–]\s+.+$/, "")
    .trim();

const isRealProjectRow = (record) => {
  const name = String(record["Project Name | اسم المشروع"] || "").trim();
  return Boolean(name) && !/^Ready\s*[—-]/i.test(name) && !/^Sales Starts:/i.test(name);
};

const rowScore = (record) => {
  const fields = [
    "Developer | المطور",
    "Unit Type | نوع الوحدة",
    "Location / Community | المنطقة",
    "Handover | التسليم",
    "Starting Price AED | السعر المبدئي",
    "Booking % | الحجز",
    "During Construction % | أثناء الإنشاء",
    "At Handover % | عند التسليم",
  ];
  let score = fields.reduce((total, key) => total + (record[key] != null && record[key] !== "" ? 1 : 0), 0);
  const developer = String(record["Developer | المطور"] || "");
  if (!/unlisted|l\.l\.c|p\.j\.s\.c/i.test(developer)) score += 2;
  if (record["Escrow Account Status | حالة حساب الضمان"] === "Verified Yes") score += 2;
  return score;
};

const quarterFromDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return `Q${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}`;
};

const unitTypeFromSource = (source) => {
  const bedrooms = source.bedrooms || [];
  const bedroomText = bedrooms.length
    ? `${bedrooms.includes("1") && bedrooms.includes("2") ? `${bedrooms[0]}–${bedrooms.at(-1)}` : bedrooms.join(", ")} bedroom`
    : "";
  const propertyText = (source.propertyTypes || []).join(", ");
  return [bedroomText, propertyText].filter(Boolean).join(" · ") || null;
};

const paymentPlanParts = (value) => {
  const numbers = String(value || "").split("/").map(Number);
  return numbers.length >= 3 && numbers.every(Number.isFinite) ? numbers : null;
};

const fetchText = async (url, attempt = 1) => {
  const response = await fetch(url, { headers });
  if (response.ok) return response.text();
  if (attempt < 4) {
    await sleep(attempt * 750);
    return fetchText(url, attempt + 1);
  }
  throw new Error(`Source request failed (${response.status}): ${url}`);
};

const parseNextData = (html) => {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match?.[1]) throw new Error("Property Finder page data was not found.");
  return JSON.parse(match[1]);
};

const sourceRecord = (project) => ({
  sourceProvider: "Property Finder",
  sourceUpdatedAt: new Date().toISOString().slice(0, 10),
  sourceProjectId: project.id,
  referenceUrl: project.shareUrl
    ? `https://www.propertyfinder.ae${project.shareUrl}`
    : null,
  title: project.title,
  developer: project.developer?.name || null,
  developerLogo: project.developer?.logoUrl || null,
  images: Array.isArray(project.images) ? project.images : [],
  coordinates: project.location?.coordinates
    ? {
        lat: Number(project.location.coordinates.lat),
        lng: Number(project.location.coordinates.lng ?? project.location.coordinates.lon),
      }
    : null,
  location: project.location?.fullName || null,
  amenities: Array.isArray(project.amenities)
    ? project.amenities.map((item) => item.name).filter(Boolean)
    : [],
  bedrooms: Array.isArray(project.bedrooms) ? project.bedrooms.map(String) : [],
  propertyTypes: Array.isArray(project.propertyTypes) ? project.propertyTypes : [],
  deliveryDate: project.deliveryDate || null,
  startingPrice: project.startingPrice ?? null,
  priceRange: project.priceRange || null,
  paymentPlans: Array.isArray(project.paymentPlans) ? project.paymentPlans : [],
  constructionPhase: project.constructionPhase || null,
  constructionProgress: project.constructionProgress ?? null,
  stockAvailability: project.stockAvailability || null,
});

const detailRecord = (detail) => {
  const media = (detail.images || [])
    .map((item) => {
      if (typeof item === "string") return { url: item, preview: item, type: "image" };
      if (!item?.source && !item?.variants?.medium) return null;
      return {
        url: item.source || item.variants?.medium,
        preview: item.variants?.medium || item.source,
        type: item.type || "image",
      };
    })
    .filter(Boolean);
  const unitOptions = (detail.units || []).flatMap((building) =>
    (building.units || []).flatMap((group) =>
      (group.list || []).map((unit) => ({
        propertyType: group.propertyType || null,
        bedrooms: unit.bedrooms ?? null,
        areaFrom: unit.areaFrom ?? null,
        areaTo: unit.areaTo ?? null,
        bathroomsFrom: unit.bathroomsFrom ?? null,
        bathroomsTo: unit.bathroomsTo ?? null,
        startingPrice: unit.startingPrice ?? null,
        layouts: (unit.layouts || []).map((layout) => ({
          layoutType: layout.layoutType || null,
          area: layout.area ?? null,
          bathrooms: layout.bathrooms ?? null,
          bedrooms: layout.bedrooms ?? null,
          floorPlans: layout.floorPlans || [],
        })),
      })),
    ),
  );
  return {
    detailUpdatedAt: new Date().toISOString().slice(0, 10),
    media,
    brochureUrl: detail.brochureUrl || null,
    masterPlanImage: detail.masterPlan?.image || null,
    unitOptions,
    ownershipType: detail.ownershipType || null,
    detailedPaymentPlans: detail.paymentPlans || [],
  };
};

const scoreCandidate = (record, candidate) => {
  let score = normalize(cleanProjectName(record["Project Name | اسم المشروع"])) === normalize(candidate.title) ? 10 : 0;
  if (developersRelated(record["Developer | المطور"], candidate.developer?.name)) score += 4;
  if (locationsRelated(record["Location / Community | المنطقة"], candidate.location?.fullName)) score += 2;
  if (
    canonicalProjectName(
      cleanProjectName(record["Project Name | اسم المشروع"]),
      record["Developer | المطور"],
    ) === canonicalProjectName(candidate.title, candidate.developer?.name)
  ) score += 3;
  return score;
};

const pageOneHtml = await fetchText(`${baseUrl}?page=1`);
const pageOneData = parseNextData(pageOneHtml);
const buildId = pageOneData.buildId;
const firstSearchResult = pageOneData.props.pageProps.searchResult;
const totalPages = firstSearchResult.meta.pagination.total;
const sourceProjects = [...firstSearchResult.data.projects];

let nextPage = 2;
const worker = async () => {
  while (true) {
    const page = nextPage++;
    if (page > totalPages) return;
    const url = `https://www.propertyfinder.ae/primary/_next/data/${buildId}/en/new-projects/lp/dubai.json?page=${page}&slug=dubai`;
    const payload = JSON.parse(await fetchText(url));
    const projects = payload.pageProps?.searchResult?.data?.projects || [];
    sourceProjects.push(...projects);
    if (page % 10 === 0 || page === totalPages) {
      console.log(`Fetched ${page}/${totalPages} pages`);
    }
    await sleep(120);
  }
};

await Promise.all(Array.from({ length: 4 }, () => worker()));

const platform = JSON.parse(await fs.readFile(platformPath, "utf8"));
const realRows = platform.projects.filter(isRealProjectRow);
const groupedRows = new Map();
for (const record of realRows) {
  const canonicalName = cleanProjectName(record["Project Name | اسم المشروع"]);
  const key = strictNormalize(canonicalName);
  const list = groupedRows.get(key) || [];
  list.push({ ...record, "Project Name | اسم المشروع": canonicalName });
  groupedRows.set(key, list);
}
const projectRecords = Array.from(groupedRows.values()).map((records) =>
  records.sort((a, b) => rowScore(b) - rowScore(a))[0],
);
const candidatesByName = new Map();
const candidatesByCanonicalName = new Map();
const candidatesByUrl = new Map();
const indexedCandidates = [];

for (const candidate of sourceProjects) {
  const key = normalize(candidate.title);
  const list = candidatesByName.get(key) || [];
  list.push(candidate);
  candidatesByName.set(key, list);
  const canonicalName = canonicalProjectName(candidate.title, candidate.developer?.name);
  if (canonicalName) {
    const canonicalList = candidatesByCanonicalName.get(canonicalName) || [];
    canonicalList.push(candidate);
    candidatesByCanonicalName.set(canonicalName, canonicalList);
  }
  const urlKey = sourceUrlKey(candidate.shareUrl);
  if (urlKey) candidatesByUrl.set(urlKey, candidate);
  indexedCandidates.push({
    candidate,
    strictName: strictNormalize(candidate.title),
    looseName: normalize(candidate.title),
    developer: normalize(candidate.developer?.name),
    canonicalName,
    numbers: numbersIn(canonicalName).join(","),
  });
}

const output = {};
const unmatched = [];
let existingOutput = {};
try {
  existingOutput = JSON.parse(await fs.readFile(outputPath, "utf8"));
} catch {
  existingOutput = {};
}

for (const record of projectRecords) {
  const name = cleanProjectName(record["Project Name | اسم المشروع"]);
  const recordSourceUrl = sourceUrlKey(record["Project Source URL | مصدر المشروع"]);
  const verifiedAliasUrl = verifiedSourceAliases.get(name);
  const candidates = candidatesByName.get(normalize(name)) || [];
  let candidate =
    (verifiedAliasUrl && candidatesByUrl.get(verifiedAliasUrl)) ||
    (recordSourceUrl && candidatesByUrl.get(recordSourceUrl)) ||
    candidates
    .map((item) => ({ item, score: scoreCandidate(record, item) }))
    .sort((a, b) => b.score - a.score)[0]?.item;
  if (!candidate && blockedAutomaticMatches.has(name)) {
    unmatched.push(name);
    continue;
  }
  if (!candidate) {
    const canonicalName = canonicalProjectName(name, record["Developer | المطور"]);
    const canonicalCandidates = hasDistinctiveCanonicalName(canonicalName)
      ? (candidatesByCanonicalName.get(canonicalName) || [])
      : [];
    const safeCanonicalCandidates = canonicalCandidates
      .filter((item) =>
        developersRelated(record["Developer | المطور"], item.developer?.name) ||
        locationsRelated(record["Location / Community | المنطقة"], item.location?.fullName))
      .map((item) => ({ item, score: scoreCandidate(record, item) }))
      .sort((a, b) => b.score - a.score);
    if (
      safeCanonicalCandidates.length === 1 ||
      (
        safeCanonicalCandidates[0] &&
        safeCanonicalCandidates[0].score > (safeCanonicalCandidates[1]?.score || 0)
      )
    ) {
      candidate = safeCanonicalCandidates[0]?.item;
    }
  }
  if (!candidate) {
    const strictName = strictNormalize(name);
    const looseName = normalize(name);
    const canonicalName = canonicalProjectName(name, record["Developer | المطور"]);
    const developer = normalize(record["Developer | المطور"]);
    const numberKey = numbersIn(canonicalName).join(",");
    const firstToken = looseName.split(" ")[0];
    const suggestions = hasDistinctiveCanonicalName(canonicalName)
      ? indexedCandidates
      .filter((item) => {
        const sameDeveloper = Boolean(developer && item.developer && developer === item.developer);
        const relatedDeveloper = developersRelated(
          record["Developer | المطور"],
          item.candidate.developer?.name,
        );
        const relatedLocation = locationsRelated(
          record["Location / Community | المنطقة"],
          item.candidate.location?.fullName,
        );
        const relatedName = Boolean(
          firstToken &&
          (
            item.looseName.split(" ").includes(firstToken) ||
            similarity(canonicalName, item.canonicalName) >= 0.72
          )
        );
        return sameDeveloper || relatedDeveloper || relatedLocation || relatedName;
      })
      .filter((item) => !numberKey || numberKey === item.numbers)
      .map((item) => {
        const textScore = Math.max(
          similarity(strictName, item.strictName),
          similarity(looseName, item.looseName),
        );
        const tokens = tokenSimilarity(name, item.candidate.title);
        const sameDeveloper = Boolean(developer && item.developer && developer === item.developer);
        const relatedDeveloper = developersRelated(
          record["Developer | المطور"],
          item.candidate.developer?.name,
        );
        const relatedLocation = locationsRelated(
          record["Location / Community | المنطقة"],
          item.candidate.location?.fullName,
        );
        const canonicalScore = similarity(canonicalName, item.canonicalName);
        return {
          ...item,
          score:
            canonicalScore * 0.55 +
            textScore * 0.25 +
            tokens * 0.1 +
            (relatedDeveloper ? 0.07 : 0) +
            (relatedLocation ? 0.03 : 0),
          sameDeveloper,
          relatedDeveloper,
          relatedLocation,
          textScore,
          tokens,
          canonicalScore,
        };
      })
      .sort((a, b) => b.score - a.score)
      : [];
    const best = suggestions[0];
    const second = suggestions[1];
    const clearLead = !second || best.score - second.score >= 0.02;
    if (
      best &&
      clearLead &&
      (
        best.textScore >= 0.94 ||
        (best.sameDeveloper && best.textScore >= 0.86) ||
        (best.sameDeveloper && best.tokens >= 0.8) ||
        (best.relatedDeveloper && best.canonicalScore >= 0.88) ||
        (best.relatedLocation && best.canonicalScore >= 0.95)
      )
    ) {
      candidate = best.candidate;
    }
  }
  if (!candidate) {
    unmatched.push(name);
    continue;
  }
  output[name] = sourceRecord(candidate);
}

const detailFields = [
  "detailUpdatedAt",
  "media",
  "brochureUrl",
  "masterPlanImage",
  "unitOptions",
  "ownershipType",
  "detailedPaymentPlans",
];
const existingBySourceId = new Map(
  Object.values(existingOutput)
    .filter((record) => record?.sourceProjectId)
    .map((record) => [record.sourceProjectId, record]),
);
for (const [name, record] of Object.entries(output)) {
  const existing = existingOutput[name] || existingBySourceId.get(record.sourceProjectId);
  if (!existing || existing.sourceProjectId !== record.sourceProjectId || !existing.detailUpdatedAt) continue;
  for (const key of detailFields) record[key] = existing[key];
}

const detailEntries = Object.entries(output).filter(([, record]) => !record.detailUpdatedAt && record.referenceUrl);
let nextDetail = 0;
let detailCompleted = 0;
const detailWorker = async () => {
  while (true) {
    const index = nextDetail++;
    if (index >= detailEntries.length) return;
    const [name, record] = detailEntries[index];
    try {
      const pathname = new URL(record.referenceUrl).pathname.split("/").filter(Boolean);
      const developerSlug = pathname.at(-2);
      const projectSlug = pathname.at(-1);
      const url = `https://www.propertyfinder.ae/primary/_next/data/${buildId}/en/new-projects/${developerSlug}/${projectSlug}.json?developerSlug=${developerSlug}&projectSlug=${projectSlug}`;
      const payload = JSON.parse(await fetchText(url));
      const detail = payload.pageProps?.detailResult;
      if (detail) {
        Object.assign(record, detailRecord(detail));
        const allImages = record.media
          .filter((item) => item.type === "image" || item.type === "master-plan")
          .map((item) => item.preview || item.url);
        if (allImages.length) record.images = allImages;
        if (detail.location?.coordinates) {
          record.coordinates = {
            lat: Number(detail.location.coordinates.lat),
            lng: Number(detail.location.coordinates.lng ?? detail.location.coordinates.lon),
          };
        }
      }
    } catch (error) {
      console.warn(`Detail skipped: ${name}`);
    }
    detailCompleted += 1;
    if (detailCompleted % 100 === 0 || detailCompleted === detailEntries.length) {
      console.log(`Fetched ${detailCompleted}/${detailEntries.length} project detail records`);
    }
    await sleep(120);
  }
};
if (detailEntries.length) {
  await Promise.all(Array.from({ length: 8 }, () => detailWorker()));
}

const sortedOutput = Object.fromEntries(
  Object.entries(output).sort(([a], [b]) => a.localeCompare(b, "en")),
);
await fs.writeFile(outputPath, `${JSON.stringify(sortedOutput, null, 2)}\n`);

const catalogProjects = projectRecords.map((record) => {
  const name = record["Project Name | اسم المشروع"];
  const source = sortedOutput[name];
  if (!source) return record;
  const payment = paymentPlanParts(source.paymentPlans?.[0]);
  return {
    ...record,
    "Project Name | اسم المشروع": name,
    "Developer | المطور": source.developer || record["Developer | المطور"],
    "Unit Type | نوع الوحدة": unitTypeFromSource(source) || record["Unit Type | نوع الوحدة"],
    "Location / Community | المنطقة": source.location || record["Location / Community | المنطقة"],
    "Handover | التسليم": quarterFromDate(source.deliveryDate) || record["Handover | التسليم"],
    "Starting Price AED | السعر المبدئي": source.startingPrice ?? record["Starting Price AED | السعر المبدئي"],
    "Booking % | الحجز": payment ? payment[0] / 100 : record["Booking % | الحجز"],
    "During Construction % | أثناء الإنشاء": payment ? payment[1] / 100 : record["During Construction % | أثناء الإنشاء"],
    "At Handover % | عند التسليم": payment ? payment[2] / 100 : record["At Handover % | عند التسليم"],
    "Data Status | حالة البيانات": "Reference source matched",
  };
});
const matchedPlatformProjects = Object.keys(sortedOutput).length;

// Property Finder carries active marketing projects that are not present in the
// working/DLD-derived sheet yet. Keep those projects visible without pretending
// that their legal DLD identity has already been reconciled.
const representedSourceIds = new Set(
  Object.values(sortedOutput)
    .map((record) => record?.sourceProjectId)
    .filter(Boolean),
);
const representedMarketingKeys = new Set(
  catalogProjects.map((record) =>
    `${strictNormalize(cleanProjectName(record["Project Name | اسم المشروع"]))}|${normalizeDeveloper(record["Developer | المطور"])}`,
  ),
);
const marketAdditions = [];
for (const candidate of sourceProjects) {
  const title = cleanProjectName(candidate.title);
  const developer = candidate.developer?.name || null;
  const sourceId = candidate.id;
  const marketingKey = `${strictNormalize(title)}|${normalizeDeveloper(developer)}`;
  if (
    !title ||
    /^ready\b|^sales starts?:/i.test(title) ||
    representedSourceIds.has(sourceId) ||
    representedMarketingKeys.has(marketingKey)
  ) {
    continue;
  }
  representedSourceIds.add(sourceId);
  representedMarketingKeys.add(marketingKey);
  const source = sourceRecord(candidate);
  const payment = paymentPlanParts(source.paymentPlans?.[0]);
  marketAdditions.push({
    "Project Name | اسم المشروع": title,
    "Developer | المطور": developer,
    "Segment | القطاع": "Off-plan",
    "Unit Type | نوع الوحدة": unitTypeFromSource(source),
    "Location / Community | المنطقة": source.location,
    "Handover | التسليم": quarterFromDate(source.deliveryDate),
    "Starting Price AED | السعر المبدئي": source.startingPrice,
    "Booking % | الحجز": payment ? payment[0] / 100 : null,
    "During Construction % | أثناء الإنشاء": payment ? payment[1] / 100 : null,
    "At Handover % | عند التسليم": payment ? payment[2] / 100 : null,
    "Escrow Account Status | حالة حساب الضمان": "DLD verification pending",
    "Data Status | حالة البيانات": "Marketplace source — legal match pending",
    "Project Source URL | مصدر المشروع": source.referenceUrl,
  });
  sortedOutput[title] = source;
}

const comprehensiveProjects = [...catalogProjects, ...marketAdditions].sort((a, b) =>
  a["Project Name | اسم المشروع"].localeCompare(b["Project Name | اسم المشروع"], "en"),
);
await fs.writeFile(
  path.join(root, "public/data/project-catalog.json"),
  `${JSON.stringify({ ...platform, projects: comprehensiveProjects }, null, 2)}\n`,
);

await fs.writeFile(outputPath, `${JSON.stringify(
  Object.fromEntries(Object.entries(sortedOutput).sort(([a], [b]) => a.localeCompare(b, "en"))),
  null,
  2,
)}\n`);

const report = {
  sourceProjects: sourceProjects.length,
  platformProjects: projectRecords.length,
  invalidRowsRemoved: platform.projects.length - realRows.length,
  duplicateRowsMerged: realRows.length - projectRecords.length,
  matched: matchedPlatformProjects,
  marketplaceProjectsAdded: marketAdditions.length,
  comprehensiveProjects: comprehensiveProjects.length,
  unmatched: unmatched.length,
  coveragePercent: Number(((matchedPlatformProjects / projectRecords.length) * 100).toFixed(1)),
  unmatchedProjects: unmatched,
};
await fs.writeFile(path.join(root, "public/data/project-live-data-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report, unmatchedProjects: undefined }, null, 2));
