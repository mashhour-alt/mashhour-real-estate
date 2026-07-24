"use client";

import { useState } from "react";
import ProjectMap, { type MapProject } from "@/app/ProjectMap";
import ProjectModal from "@/components/ProjectModal";
import SectionHead from "@/components/SectionHead";
import { useLang, useSiteData } from "@/lib/site-context";
import type { Project } from "@/lib/types";

export default function MapPage() {
  const { t } = useLang();
  const { data, loading } = useSiteData();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const projects = data?.projects || [];

  return (
    <section className="section map-section">
      <SectionHead
        number="01"
        eyebrow="LOCATION INTELLIGENCE"
        title={t.mapTitle}
        sub={t.mapSub}
      />
      {loading ? (
        <p className="page-loading">{t.loading}</p>
      ) : (
        <ProjectMap
          projects={projects as MapProject[]}
          onSelect={(project) => setSelectedProject(project as Project)}
          labels={{
            mapped: t.mapMapped,
            projects: t.projects,
            hint: t.mapHint,
            empty: t.mapEmpty,
          }}
        />
      )}
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </section>
  );
}
