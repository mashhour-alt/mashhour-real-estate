import type { Area, Project } from "./types";
import { areaFrom, slugify } from "./format";

export type AreaSummary = {
  name: string;
  slug: string;
  segments: Area[];
  projectCount: number;
  psf: number | null;
  yield: number | null;
  demand: number | null;
  appreciation: number | null;
  tier: string | null;
};

/** Groups the raw area rows by area name and joins each with its project count. */
export function buildAreaSummaries(
  areas: Area[],
  projects: Project[],
): AreaSummary[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    const name = areaFrom(project["Location / Community | المنطقة"]);
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  const grouped = new Map<string, Area[]>();
  for (const row of areas) {
    if (!row.Area) continue;
    grouped.set(row.Area, [...(grouped.get(row.Area) || []), row]);
  }

  return [...grouped.entries()]
    .map(([name, segments]) => {
      // Prefer the residential row for the headline PSF/yield when present.
      const primary =
        segments.find((s) => s.Segment === "Residential") || segments[0];
      return {
        name,
        slug: slugify(name),
        segments,
        projectCount: counts.get(name) || 0,
        psf: primary["PSF Benchmark"],
        yield: primary["Gross Yield"],
        demand: primary["Demand /10"],
        appreciation: primary["Appreciation p.a."] ?? null,
        tier: primary.Tier,
      };
    })
    .sort((a, b) => b.projectCount - a.projectCount || a.name.localeCompare(b.name));
}

export function findAreaBySlug(
  slug: string,
  areas: Area[],
  projects: Project[],
): AreaSummary | null {
  return buildAreaSummaries(areas, projects).find((a) => a.slug === slug) || null;
}
