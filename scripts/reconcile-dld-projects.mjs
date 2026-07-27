import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public/data/project-catalog.json");
const aliasesPath = path.join(root, "public/data/project-aliases.json");
const reportPath = path.join(root, "public/data/dld-reconciliation-report.json");

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const aliases = JSON.parse(await fs.readFile(aliasesPath, "utf8"));
const nameField = "Project Name | اسم المشروع";
const escrowField = "Escrow Account Status | حالة حساب الضمان";
const statusField = "Data Status | حالة البيانات";
const sourceField = "Project Source URL | مصدر المشروع";

// Manually reviewed marketing-name → DLD-record pairs. Only pairs with the same
// developer and an unambiguous project identity belong here.
const reviewedMatches = new Map([
  ["Address The Bay", "Address Residences The Bay"],
  ["Avenue Park Towers 2", "Avenue Park Towers II"],
  ["Beach Walk Residences 4 By Imtiaz", "Beach Walk Phase 4 by Imtiaz"],
  ["Emerge Residences", "Émerge Residences"],
  ["Palace Beach Residence", "Palace By The Beach"],
  ["Royal Regency", "Royal Regency Suites"],
  ["Sea Mirror", "Sea Mirror Residences"],
  ["Teal", "Teal Tower"],
  ["The Biltmore Residences Sufouh", "Biltmore Sufouh"],
  ["The Residence By Prestige One", "Prestige One Residences"],
]);

const byName = new Map(catalog.projects.map((project) => [project[nameField], project]));
const absorbed = new Set();
const reconciled = [];

for (const [marketingName, dldName] of reviewedMatches) {
  const marketing = byName.get(marketingName);
  const dld = byName.get(dldName);
  if (!marketing || !dld) continue;
  if (!String(marketing[statusField] || "").includes("legal match pending")) continue;
  if (String(dld[statusField] || "").includes("legal match pending")) continue;

  for (const [field, value] of Object.entries(marketing)) {
    if ((dld[field] === null || dld[field] === "") && value !== null && value !== "") {
      dld[field] = value;
    }
  }
  // Legal status, escrow result and source remain owned by the DLD-derived row.
  dld[escrowField] = byName.get(dldName)[escrowField];
  dld[statusField] = "DLD name reconciled";
  dld[sourceField] = "https://dubailand.gov.ae/en/open-data/real-estate-data/";
  aliases[marketingName] = dldName;
  absorbed.add(marketingName);
  reconciled.push({ marketingName, dldName, developer: dld["Developer | المطور"] });
}

const projects = catalog.projects.filter((project) => !absorbed.has(project[nameField]));
projects.sort((a, b) => a[nameField].localeCompare(b[nameField], "en"));

const pendingBefore = catalog.projects.filter((project) =>
  String(project[statusField] || "").includes("legal match pending"),
).length;
const pendingAfter = projects.filter((project) =>
  String(project[statusField] || "").includes("legal match pending"),
).length;
const cumulativeReconciled = [...reviewedMatches]
  .filter(([marketingName, dldName]) => aliases[marketingName] === dldName && byName.has(dldName))
  .map(([marketingName, dldName]) => ({
    marketingName,
    dldName,
    developer: byName.get(dldName)["Developer | المطور"],
  }));

const report = {
  reconciledAt: new Date().toISOString(),
  method: "Explicit reviewed marketing-name to DLD-record reconciliation",
  before: projects.length + cumulativeReconciled.length,
  after: projects.length,
  recordsMerged: cumulativeReconciled.length,
  pendingBefore: pendingAfter + cumulativeReconciled.length,
  pendingAfter,
  reconciled: cumulativeReconciled,
  matchesAddedThisRun: reconciled.length,
};

await fs.writeFile(catalogPath, `${JSON.stringify({ ...catalog, projects }, null, 2)}\n`);
await fs.writeFile(
  aliasesPath,
  `${JSON.stringify(Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b, "en"))), null, 2)}\n`,
);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify(report, null, 2));
