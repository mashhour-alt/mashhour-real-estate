"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Articles from "@/components/Articles";
import ProjectCard from "@/components/ProjectCard";
import ProjectModal from "@/components/ProjectModal";
import SectionHead from "@/components/SectionHead";
import { areaFrom } from "@/lib/format";
import { useLang, useSiteData } from "@/lib/site-context";
import type { Project } from "@/lib/types";

const PAGE_SIZE = 12;

function ProjectsView() {
  const { t } = useLang();
  const { data, loading } = useSiteData();
  const searchParams = useSearchParams();

  // Deep links such as /projects?area=Business%20Bay seed the filters directly.
  const [query, setQuery] = useState("");
  const [area, setArea] = useState(() => searchParams.get("area") || "");
  const [developer, setDeveloper] = useState(() => searchParams.get("developer") || "");
  const [price, setPrice] = useState("");
  const [handover, setHandover] = useState("");
  const [sort, setSort] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const resetPage = () => setVisible(PAGE_SIZE);

  const projects = useMemo(() => data?.projects || [], [data]);

  const areas = useMemo(
    () =>
      Array.from(
        new Set(projects.map((project) => areaFrom(project["Location / Community | المنطقة"]))),
      ).sort(),
    [projects],
  );

  const developers = useMemo(
    () =>
      Array.from(
        new Set(projects.map((project) => project["Developer | المطور"]).filter(Boolean)),
      ).sort(),
    [projects],
  );

  const handoverYears = useMemo(
    () =>
      Array.from(
        new Set(
          projects
            .map((p) => {
              const match = /(20\d{2})/.exec(String(p["Handover | التسليم"] || ""));
              return match ? match[1] : "";
            })
            .filter(Boolean),
        ),
      ).sort(),
    [projects],
  );

  // Price brackets in AED, chosen from the data distribution.
  const priceBands: Record<string, [number, number]> = {
    "0-1m": [0, 1_000_000],
    "1m-2m": [1_000_000, 2_000_000],
    "2m-5m": [2_000_000, 5_000_000],
    "5m+": [5_000_000, Infinity],
  };

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    const band = price ? priceBands[price] : null;

    const result = projects.filter((project) => {
      const projectArea = areaFrom(project["Location / Community | المنطقة"]);
      const haystack = [
        project["Project Name | اسم المشروع"],
        project["Developer | المطور"],
        projectArea,
      ]
        .join(" ")
        .toLowerCase();

      const projectPrice = project["Starting Price AED | السعر المبدئي"];
      const projectYear = /(20\d{2})/.exec(String(project["Handover | التسليم"] || ""))?.[1] || "";

      return (
        (!needle || haystack.includes(needle)) &&
        (!area || projectArea === area) &&
        (!developer || project["Developer | المطور"] === developer) &&
        (!band || (projectPrice != null && projectPrice >= band[0] && projectPrice < band[1])) &&
        (!handover || projectYear === handover)
      );
    });

    // Sorting: nulls always sink to the bottom so empty prices don't lead.
    if (sort === "price-asc" || sort === "price-desc") {
      result.sort((a, b) => {
        const pa = a["Starting Price AED | السعر المبدئي"];
        const pb = b["Starting Price AED | السعر المبدئي"];
        if (pa == null) return 1;
        if (pb == null) return -1;
        return sort === "price-asc" ? pa - pb : pb - pa;
      });
    } else if (sort === "handover") {
      result.sort((a, b) => {
        const ya = /(20\d{2})/.exec(String(a["Handover | التسليم"] || ""))?.[1] || "9999";
        const yb = /(20\d{2})/.exec(String(b["Handover | التسليم"] || ""))?.[1] || "9999";
        return ya.localeCompare(yb);
      });
    }

    return result;
  }, [projects, query, area, developer, price, handover, sort]);

  return (
    <section className="section light">
      <SectionHead
        number="02"
        eyebrow="PROJECT DATABASE"
        title={t.explore}
        aside={
          <span className="result-count">
            {filtered.length.toLocaleString()} {t.results}
          </span>
        }
      />

      <div className="filters">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder={t.search}
            type="search"
            inputMode="search"
          />
        </label>
        <select
          value={area}
          onChange={(event) => {
            setArea(event.target.value);
            setVisible(PAGE_SIZE);
          }}
        >
          <option value="">{t.allAreas}</option>
          {areas.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={developer}
          onChange={(event) => {
            setDeveloper(event.target.value);
            setVisible(PAGE_SIZE);
          }}
        >
          <option value="">{t.allDevelopers}</option>
          {developers.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={price}
          onChange={(event) => {
            setPrice(event.target.value);
            resetPage();
          }}
        >
          <option value="">{t.allPrices}</option>
          <option value="0-1m">{t.priceUnder1m}</option>
          <option value="1m-2m">AED 1M – 2M</option>
          <option value="2m-5m">AED 2M – 5M</option>
          <option value="5m+">{t.price5mPlus}</option>
        </select>
        <select
          value={handover}
          onChange={(event) => {
            setHandover(event.target.value);
            resetPage();
          }}
        >
          <option value="">{t.allHandover}</option>
          {handoverYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            resetPage();
          }}
        >
          <option value="">{t.sortDefault}</option>
          <option value="price-asc">{t.sortPriceAsc}</option>
          <option value="price-desc">{t.sortPriceDesc}</option>
          <option value="handover">{t.sortHandover}</option>
        </select>
      </div>

      {loading ? (
        <p className="page-loading">{t.loading}</p>
      ) : (
        <>
          <div className="project-grid">
            {filtered.slice(0, visible).map((project, index) => (
              <ProjectCard
                key={`${project["Project Name | اسم المشروع"]}-${index}`}
                project={project}
                index={index}
                onOpen={setSelectedProject}
              />
            ))}
          </div>
          {visible < filtered.length && (
            <button className="load-more" onClick={() => setVisible((n) => n + PAGE_SIZE)}>
              {t.loadMore} ↓
            </button>
          )}
        </>
      )}

      <Articles scope="project" heading={t.articlesProjects} />

      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </section>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<section className="section light"><p className="page-loading">…</p></section>}>
      <ProjectsView />
    </Suspense>
  );
}
