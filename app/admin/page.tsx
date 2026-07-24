"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import SectionHead from "@/components/SectionHead";
import { areaFrom } from "@/lib/format";
import { useSiteData } from "@/lib/site-context";

type Article = {
  id: number;
  slug: string;
  scope: string;
  scopeRef: string;
  titleEn: string;
  titleAr: string;
  excerptEn: string;
  excerptAr: string;
  bodyEn: string;
  bodyAr: string;
  coverImage: string;
  authorName: string;
  authorPhoto: string;
  authorPhone: string;
  published: number;
};

type Draft = Omit<Article, "id" | "slug" | "published"> & { published: boolean };

const EMPTY: Draft = {
  scope: "area",
  scopeRef: "",
  titleEn: "",
  titleAr: "",
  excerptEn: "",
  excerptAr: "",
  bodyEn: "",
  bodyAr: "",
  coverImage: "",
  authorName: "",
  authorPhoto: "",
  authorPhone: "",
  published: true,
};

const STORAGE_KEY = "mashhour.admin";

export default function AdminPage() {
  const { data } = useSiteData();

  const [status, setStatus] = useState<"loading" | "error" | "setup" | "locked" | "ready">(
    "loading",
  );
  const [dbError, setDbError] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [articles, setArticles] = useState<Article[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);

  /* --- reference lists pulled from the existing dataset ---------------- */
  const options = useMemo(() => {
    const projects = data?.projects || [];
    return {
      area: Array.from(
        new Set(projects.map((p) => areaFrom(p["Location / Community | المنطقة"]))),
      ).sort(),
      developer: Array.from(
        new Set(projects.map((p) => p["Developer | المطور"]).filter(Boolean)),
      ).sort(),
      project: Array.from(
        new Set(projects.map((p) => p["Project Name | اسم المشروع"]).filter(Boolean)),
      ).sort(),
    };
  }, [data]);

  /* --- boot: is the database reachable, and is a password set? -------- */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth")
      .then((r) => r.json())
      .then((payload: { ready?: boolean; setupNeeded?: boolean; error?: string }) => {
        if (cancelled) return;
        if (!payload.ready) {
          setDbError(payload.error || "Database unavailable");
          setStatus("error");
          return;
        }
        if (payload.setupNeeded) {
          setStatus("setup");
          return;
        }
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          setPassword(saved);
          setStatus("ready");
        } else {
          setStatus("locked");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setDbError("Could not reach the server");
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadArticles = useCallback(async (pass: string) => {
    const response = await fetch("/api/articles", { headers: { "x-admin-password": pass } });
    const payload = (await response.json()) as { articles?: Article[]; error?: string };
    if (payload.articles) setArticles(payload.articles);
  }, []);

  useEffect(() => {
    // loadArticles is async; the setState runs after the fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status === "ready" && password) loadArticles(password);
  }, [status, password, loadArticles]);

  /* --- auth actions ---------------------------------------------------- */
  const submitPassword = async (setup: boolean) => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password, setup }),
      });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!payload.ok) {
        setMessage(payload.error || "Failed");
        return;
      }
      sessionStorage.setItem(STORAGE_KEY, password);
      setStatus("ready");
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setArticles([]);
    setStatus("locked");
  };

  /* --- article actions -------------------------------------------------- */
  const saveArticle = async () => {
    setBusy(true);
    setMessage("");
    try {
      const url = editingId ? `/api/articles/${editingId}` : "/api/articles";
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "content-type": "application/json", "x-admin-password": password },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as { article?: Article; error?: string };
      if (!payload.article) {
        setMessage(payload.error || "Could not save");
        return;
      }
      setMessage(editingId ? "Article updated ✓" : "Article created ✓");
      setDraft(EMPTY);
      setEditingId(null);
      await loadArticles(password);
    } finally {
      setBusy(false);
    }
  };

  const editArticle = (article: Article) => {
    setEditingId(article.id);
    setDraft({ ...article, published: article.published === 1 });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteArticle = async (article: Article) => {
    if (!window.confirm(`Delete "${article.titleEn}"?`)) return;
    await fetch(`/api/articles/${article.id}`, {
      method: "DELETE",
      headers: { "x-admin-password": password },
    });
    await loadArticles(password);
  };

  /* --- render ----------------------------------------------------------- */
  if (status === "loading") {
    return (
      <section className="section light">
        <p className="page-loading">Checking database…</p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <section className="section light">
        <SectionHead
          number="00"
          eyebrow="ADMIN"
          title="Coming soon"
          sub="The content dashboard will be available once the database is connected."
        />
        <div className="admin-panel admin-note">
          <p>
            This area is being set up. Article management goes live as soon as the
            database is enabled on the hosting platform.
          </p>
        </div>
      </section>
    );
  }

  if (status === "setup" || status === "locked") {
    const isSetup = status === "setup";
    return (
      <section className="section light">
        <SectionHead
          number="00"
          eyebrow="ADMIN"
          title={isSetup ? "Create admin password" : "Admin sign in"}
          sub={
            isSetup
              ? "No password exists yet. Set one now — this is a one-time step."
              : "Enter the admin password to manage content."
          }
        />
        <div className="admin-panel admin-gate">
          <label>
            <small>PASSWORD</small>
            <input
              type="password"
              value={password}
              autoComplete={isSetup ? "new-password" : "current-password"}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") submitPassword(isSetup);
              }}
            />
          </label>
          <button disabled={busy} onClick={() => submitPassword(isSetup)}>
            {isSetup ? "Set password" : "Sign in"} ↗
          </button>
          {message && <p className="admin-message bad">{message}</p>}
        </div>
      </section>
    );
  }

  const refList = options[draft.scope as keyof typeof options] || [];

  return (
    <section className="section light">
      <SectionHead
        number="07"
        eyebrow="ADMIN"
        title="Articles"
        sub="Add and edit the articles shown on project, developer and area pages."
        aside={
          <button className="calc-reset" onClick={signOut}>
            Sign out
          </button>
        }
      />

      <div className="admin-layout">
        {/* Editor */}
        <div className="admin-panel">
          <div className="detail-heading">
            <span>{editingId ? "EDIT" : "NEW"}</span>
            <h3>{editingId ? "Edit article" : "New article"}</h3>
          </div>

          <div className="admin-fields">
            <label>
              <small>SECTION</small>
              <select
                value={draft.scope}
                onChange={(event) =>
                  setDraft({ ...draft, scope: event.target.value, scopeRef: "" })
                }
              >
                <option value="area">Area</option>
                <option value="developer">Developer</option>
                <option value="project">Project</option>
              </select>
            </label>

            <label>
              <small>ATTACHED TO</small>
              <input
                list="admin-refs"
                value={draft.scopeRef}
                placeholder="Leave empty to show in all"
                onChange={(event) => setDraft({ ...draft, scopeRef: event.target.value })}
              />
              <datalist id="admin-refs">
                {refList.slice(0, 400).map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>

            <label>
              <small>TITLE (EN) *</small>
              <input
                value={draft.titleEn}
                onChange={(event) => setDraft({ ...draft, titleEn: event.target.value })}
              />
            </label>
            <label>
              <small>TITLE (AR)</small>
              <input
                dir="rtl"
                value={draft.titleAr}
                onChange={(event) => setDraft({ ...draft, titleAr: event.target.value })}
              />
            </label>

            <label>
              <small>COVER IMAGE URL</small>
              <input
                value={draft.coverImage}
                placeholder="https://…"
                onChange={(event) => setDraft({ ...draft, coverImage: event.target.value })}
              />
            </label>
            <label>
              <small>AUTHOR NAME *</small>
              <input
                value={draft.authorName}
                onChange={(event) => setDraft({ ...draft, authorName: event.target.value })}
              />
            </label>
            <label>
              <small>AUTHOR PHOTO URL</small>
              <input
                value={draft.authorPhoto}
                placeholder="https://…"
                onChange={(event) => setDraft({ ...draft, authorPhoto: event.target.value })}
              />
            </label>
            <label>
              <small>AUTHOR PHONE</small>
              <input
                value={draft.authorPhone}
                placeholder="+971…"
                onChange={(event) => setDraft({ ...draft, authorPhone: event.target.value })}
              />
            </label>

            <label className="wide">
              <small>SUMMARY (EN)</small>
              <textarea
                rows={2}
                value={draft.excerptEn}
                onChange={(event) => setDraft({ ...draft, excerptEn: event.target.value })}
              />
            </label>
            <label className="wide">
              <small>SUMMARY (AR)</small>
              <textarea
                dir="rtl"
                rows={2}
                value={draft.excerptAr}
                onChange={(event) => setDraft({ ...draft, excerptAr: event.target.value })}
              />
            </label>
            <label className="wide">
              <small>BODY (EN)</small>
              <textarea
                rows={7}
                value={draft.bodyEn}
                onChange={(event) => setDraft({ ...draft, bodyEn: event.target.value })}
              />
            </label>
            <label className="wide">
              <small>BODY (AR)</small>
              <textarea
                dir="rtl"
                rows={7}
                value={draft.bodyAr}
                onChange={(event) => setDraft({ ...draft, bodyAr: event.target.value })}
              />
            </label>

            <label className="admin-check wide">
              <input
                type="checkbox"
                checked={draft.published}
                onChange={(event) => setDraft({ ...draft, published: event.target.checked })}
              />
              <span>Published (visible on the site)</span>
            </label>
          </div>

          <div className="admin-actions">
            <button disabled={busy} onClick={saveArticle}>
              {editingId ? "Save changes" : "Create article"} ↗
            </button>
            {editingId && (
              <button
                className="ghost-button"
                onClick={() => {
                  setEditingId(null);
                  setDraft(EMPTY);
                }}
              >
                Cancel
              </button>
            )}
          </div>
          {message && (
            <p className={message.includes("✓") ? "admin-message ok" : "admin-message bad"}>
              {message}
            </p>
          )}
        </div>

        {/* List */}
        <aside className="admin-panel">
          <div className="detail-heading">
            <span>{articles.length}</span>
            <h3>All articles</h3>
          </div>
          {articles.length === 0 ? (
            <p className="page-loading">No articles yet.</p>
          ) : (
            <div className="admin-list">
              {articles.map((article) => (
                <article key={article.id}>
                  <div>
                    <strong>{article.titleEn}</strong>
                    <small>
                      {article.scope}
                      {article.scopeRef ? ` · ${article.scopeRef}` : ""}
                      {article.published ? "" : " · draft"}
                    </small>
                  </div>
                  <div className="admin-list-actions">
                    <button onClick={() => editArticle(article)}>Edit</button>
                    <button className="danger" onClick={() => deleteArticle(article)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
