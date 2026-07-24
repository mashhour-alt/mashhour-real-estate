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
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  const filtered = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return projects.filter((project) => {
      const projectArea = areaFrom(project["Location / Community | المنطقة"]);
      const haystack = [
        project["Project Name | اسم المشروع"],
        project["Developer | المطور"],
        projectArea,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!needle || haystack.includes(needle)) &&
        (!area || projectArea === area) &&
        (!developer || project["Developer | المطور"] === developer)
      );
    });
  }, [projects, query, area, developer]);

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
