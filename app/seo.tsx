"use client";

import { useEffect } from "react";

type StructuredData = Record<string, unknown>;

const SCRIPT_ID = "mashhour-structured-data";

const setMeta = (name: string, content: string) => {
  let tag = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

/**
 * Pages here are client components, so Next's static `metadata` export is not
 * available. This sets the document title, description and a JSON-LD block at
 * runtime instead. Only fields that genuinely exist are emitted — nothing is
 * padded with placeholder values.
 */
export function PageSeo({
  title,
  description,
  structuredData,
}: {
  title: string;
  description?: string;
  structuredData?: StructuredData | null;
}) {
  useEffect(() => {
    document.title = `${title} | Mashhour Real Estate`;
    if (description) setMeta("description", description);
  }, [title, description]);

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) existing.remove();
    if (!structuredData) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [structuredData]);

  return null;
}

/** Drops keys whose value is null/undefined/empty so no blank fields are published. */
export const compact = (input: StructuredData): StructuredData =>
  Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value == null) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return true;
    }),
  );
