import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalogPath = path.join(root, "public/data/project-catalog.json");
const liveDataPath = path.join(root, "public/data/project-live-data.json");
const aliasesPath = path.join(root, "public/data/project-aliases.json");
const reportPath = path.join(root, "public/data/project-catalog-cleanup-report.json");

const catalog = JSON.parse(await fs.readFile(catalogPath, "utf8"));
const liveData = JSON.parse(await fs.readFile(liveDataPath, "utf8"));

const projectName = (record) => record["Project Name | اسم المشروع"];
const present = (value) => value !== null && value !== undefined && value !== "";
const isDldVerified = (record) =>
  record["Escrow Account Status | حالة حساب الضمان"] === "Verified Yes";
const isDldSource = (record) =>
  String(record["Project Source URL | مصدر المشروع"] || "").includes("dubailand.gov.ae");

const recordScore = (record) => {
  const filledFields = Object.values(record).filter(present).length;
  return (
    (isDldVerified(record) ? 100 : 0) +
    (isDldSource(record) ? 30 : 0) +
    (String(record["Data Status | حالة البيانات"] || "").includes("legal match pending") ? 0 : 15) +
    filledFields
  );
};

const groups = new Map();
for (const record of catalog.projects) {
  const name = projectName(record);
  const sourceProjectId = liveData[name]?.sourceProjectId;
  const key = sourceProjectId ? `source:${sourceProjectId}` : `name:${name.trim().toLowerCase()}`;
  const group = groups.get(key) || [];
  group.push(record);
  groups.set(key, group);
}

const aliases = {};
const mergedGroups = [];
const cleanedProjects = [];

for (const records of groups.values()) {
  const ranked = [...records].sort((a, b) => recordScore(b) - recordScore(a));
  const canonical = { ...ranked[0] };
  const canonicalName = projectName(canonical);

  for (const record of ranked.slice(1)) {
    for (const [field, value] of Object.entries(record)) {
      if (!present(canonical[field]) && present(value)) canonical[field] = value;
    }
    const alias = projectName(record);
    if (alias !== canonicalName) aliases[alias] = canonicalName;
  }

  if (records.length > 1) {
    mergedGroups.push({
      canonicalName,
      aliases: records.map(projectName).filter((name) => name !== canonicalName),
      sourceProjectId: liveData[canonicalName]?.sourceProjectId || null,
    });
  }
  cleanedProjects.push(canonical);
}

cleanedProjects.sort((a, b) => projectName(a).localeCompare(projectName(b), "en"));

const report = {
  cleanedAt: new Date().toISOString(),
  method: "Conservative merge: identical marketplace source project ID or identical project name",
  before: catalog.projects.length,
  after: cleanedProjects.length,
  duplicateRowsRemoved: catalog.projects.length - cleanedProjects.length,
  mergedGroups: mergedGroups.length,
  aliasesCreated: Object.keys(aliases).length,
  groups: mergedGroups,
};

await fs.writeFile(
  catalogPath,
  `${JSON.stringify({ ...catalog, projects: cleanedProjects }, null, 2)}\n`,
);
await fs.writeFile(
  aliasesPath,
  `${JSON.stringify(Object.fromEntries(Object.entries(aliases).sort(([a], [b]) => a.localeCompare(b, "en"))), null, 2)}\n`,
);
await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(JSON.stringify({
  before: report.before,
  after: report.after,
  duplicateRowsRemoved: report.duplicateRowsRemoved,
  mergedGroups: report.mergedGroups,
  aliasesCreated: report.aliasesCreated,
}, null, 2));
