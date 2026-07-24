"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { copy, type Copy } from "./copy";
import type { Data, Lang, Project } from "./types";
import { projectKey } from "./format";

const LANG_STORAGE_KEY = "mashhour.lang";
const COMPARE_STORAGE_KEY = "mashhour.compare";
export const COMPARE_LIMIT = 5;

/* ------------------------------------------------------------------ */
/* Language                                                            */
/* ------------------------------------------------------------------ */

type LangValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Copy;
  dir: "rtl" | "ltr";
};

const LangContext = createContext<LangValue | null>(null);

function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
      // Storage is unavailable during SSR, so the saved language can only be
      // applied after mount. Reading it earlier would break hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored === "en" || stored === "ar" || stored === "it") setLangState(stored);
    } catch {
      /* storage unavailable — keep default */
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const value = useMemo<LangValue>(
    () => ({ lang, setLang, t: copy[lang] as Copy, dir }),
    [lang, setLang, dir],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const context = useContext(LangContext);
  if (!context) throw new Error("useLang must be used inside <SiteProviders>");
  return context;
}

/* ------------------------------------------------------------------ */
/* Site data (fetched once, shared by every route)                     */
/* ------------------------------------------------------------------ */

type DataValue = { data: Data | null; loading: boolean; error: boolean };

const DataContext = createContext<DataValue | null>(null);

function SiteDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/offplan.json")
      .then((response) => {
        if (!response.ok) throw new Error("Data unavailable");
        return response.json();
      })
      .then((payload: Data) => {
        if (!cancelled) setData(payload);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<DataValue>(
    () => ({ data, loading: !data && !error, error }),
    [data, error],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useSiteData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useSiteData must be used inside <SiteProviders>");
  return context;
}

/* ------------------------------------------------------------------ */
/* Compare list (persists across route changes and reloads)            */
/* ------------------------------------------------------------------ */

type CompareValue = {
  compare: Project[];
  toggleCompare: (project: Project) => void;
  removeCompare: (project: Project) => void;
  clearCompare: () => void;
  isCompared: (project: Project) => boolean;
  full: boolean;
};

const CompareContext = createContext<CompareValue | null>(null);

function CompareProvider({ children }: { children: ReactNode }) {
  const [compare, setCompare] = useState<Project[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Same hydration constraint as the language above.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (Array.isArray(parsed)) setCompare(parsed.slice(0, COMPARE_LIMIT));
      }
    } catch {
      /* ignore malformed storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compare));
    } catch {
      /* ignore */
    }
  }, [compare, hydrated]);

  const toggleCompare = useCallback((project: Project) => {
    setCompare((current) => {
      const key = projectKey(project);
      if (current.some((item) => projectKey(item) === key)) {
        return current.filter((item) => projectKey(item) !== key);
      }
      return current.length < COMPARE_LIMIT ? [...current, project] : current;
    });
  }, []);

  const removeCompare = useCallback((project: Project) => {
    const key = projectKey(project);
    setCompare((current) => current.filter((item) => projectKey(item) !== key));
  }, []);

  const clearCompare = useCallback(() => setCompare([]), []);

  const isCompared = useCallback(
    (project: Project) => compare.some((item) => projectKey(item) === projectKey(project)),
    [compare],
  );

  const value = useMemo<CompareValue>(
    () => ({
      compare,
      toggleCompare,
      removeCompare,
      clearCompare,
      isCompared,
      full: compare.length >= COMPARE_LIMIT,
    }),
    [compare, toggleCompare, removeCompare, clearCompare, isCompared],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error("useCompare must be used inside <SiteProviders>");
  return context;
}

/* ------------------------------------------------------------------ */

export function SiteProviders({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <SiteDataProvider>
        <CompareProvider>{children}</CompareProvider>
      </SiteDataProvider>
    </LangProvider>
  );
}
