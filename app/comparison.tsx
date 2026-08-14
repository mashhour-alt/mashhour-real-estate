"use client";

import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "./language-context";

export const COMPARISON_STORAGE_KEY = "mashhour-comparison";
export const MAX_COMPARISON = 4;

const readStored = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPARISON_STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.slice(0, MAX_COMPARISON) : [];
  } catch {
    return [];
  }
};

/**
 * Shared shortlist state. The list lives in localStorage so the projects page,
 * project detail page and compare page all read and write the same selection,
 * and a custom event keeps every mounted component in sync within one tab.
 */
export function useComparison() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    setNames(readStored());
    const sync = () => setNames(readStored());
    window.addEventListener("mashhour-comparison-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("mashhour-comparison-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const persist = useCallback((next: string[]) => {
    if (next.length) localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(COMPARISON_STORAGE_KEY);
    setNames(next);
    window.dispatchEvent(new Event("mashhour-comparison-change"));
  }, []);

  const add = useCallback((name: string) => {
    const current = readStored();
    if (current.includes(name) || current.length >= MAX_COMPARISON) return;
    persist([...current, name]);
  }, [persist]);

  const remove = useCallback((name: string) => {
    persist(readStored().filter((item) => item !== name));
  }, [persist]);

  const toggle = useCallback((name: string) => {
    const current = readStored();
    if (current.includes(name)) persist(current.filter((item) => item !== name));
    else if (current.length < MAX_COMPARISON) persist([...current, name]);
  }, [persist]);

  const clear = useCallback(() => persist([]), [persist]);

  return { names, add, remove, toggle, clear, isFull: names.length >= MAX_COMPARISON };
}

export function CompareButton({ name, className = "" }: { name: string; className?: string }) {
  const { names, toggle, isFull } = useComparison();
  const { arabic } = useLanguage();
  const selected = names.includes(name);
  const disabled = !selected && isFull;

  return (
    <button
      type="button"
      className={`compare-chip${selected ? " selected" : ""} ${className}`.trim()}
      aria-pressed={selected}
      disabled={disabled}
      title={disabled ? (arabic ? `الحد الأقصى ${MAX_COMPARISON} مشاريع` : `Maximum ${MAX_COMPARISON} projects`) : undefined}
      onClick={(event) => {
        // Cards are wrapped in links; keep the click on the chip itself.
        event.preventDefault();
        event.stopPropagation();
        toggle(name);
      }}
    >
      {selected ? (arabic ? "✓ في المقارنة" : "✓ In compare") : (arabic ? "+ مقارنة" : "+ Compare")}
    </button>
  );
}

export function ComparisonBar() {
  const { names, remove, clear } = useComparison();
  const { arabic } = useLanguage();
  if (names.length < 2) return null;

  return (
    <div className="comparison-bar" role="region" aria-label={arabic ? "شريط المقارنة" : "Comparison bar"}>
      <div className="comparison-bar-inner">
        <div className="comparison-bar-items">
          <strong>
            {arabic ? `تم اختيار ${names.length} مشاريع` : `${names.length} projects selected`}
          </strong>
          <div>
            {names.map((name) => (
              <span key={name}>
                {name}
                <button type="button" aria-label={`Remove ${name}`} onClick={() => remove(name)}>×</button>
              </span>
            ))}
          </div>
        </div>
        <div className="comparison-bar-actions">
          <button type="button" className="comparison-bar-clear" onClick={clear}>
            {arabic ? "مسح" : "Clear"}
          </button>
          <a className="button primary" href="/compare">
            {arabic ? "قارن الآن" : "Compare now"} <b>→</b>
          </a>
        </div>
      </div>
    </div>
  );
}
