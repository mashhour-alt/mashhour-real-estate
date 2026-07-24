"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/lib/site-context";

export type Article = {
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
};

export default function Articles({
  scope,
  scopeRef,
  heading,
}: {
  scope: "project" | "developer" | "area";
  scopeRef?: string;
  heading: string;
}) {
  const { lang } = useLang();
  const [articles, setArticles] = useState<Article[]>([]);
  const [open, setOpen] = useState<Article | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams({ scope });
    if (scopeRef) query.set("scopeRef", scopeRef);

    fetch(`/api/articles?${query}`)
      .then((response) => (response.ok ? response.json() : { articles: [] }))
      .then((payload: { articles?: Article[] }) => {
        if (!cancelled) setArticles(payload.articles || []);
      })
      .catch(() => {
        // The articles section simply stays hidden if the database is not ready.
      });
    return () => {
      cancelled = true;
    };
  }, [scope, scopeRef]);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", close);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", close);
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  if (articles.length === 0) return null;

  const pick = (en: string, ar: string) => (lang === "ar" && ar ? ar : en);

  return (
    <div className="articles-block">
      <div className="detail-heading">
        <span>★</span>
        <h3>{heading}</h3>
      </div>

      <div className="article-grid">
        {articles.map((article) => (
          <article
            className="article-card"
            key={article.id}
            role="button"
            tabIndex={0}
            onClick={() => setOpen(article)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setOpen(article);
              }
            }}
          >
            {article.coverImage && (
              <div className="article-cover">
                <img src={article.coverImage} alt="" loading="lazy" />
              </div>
            )}
            <div className="article-body">
              <h4>{pick(article.titleEn, article.titleAr)}</h4>

              <div className="article-author">
                {article.authorPhoto ? (
                  <img src={article.authorPhoto} alt="" loading="lazy" />
                ) : (
                  <span className="article-avatar">{article.authorName.charAt(0)}</span>
                )}
                <div>
                  <strong>{article.authorName}</strong>
                  {article.authorPhone && (
                    <a
                      href={`tel:${article.authorPhone.replace(/\s/g, "")}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      {article.authorPhone}
                    </a>
                  )}
                </div>
              </div>

              {pick(article.excerptEn, article.excerptAr) && (
                <p>{pick(article.excerptEn, article.excerptAr)}</p>
              )}
            </div>
          </article>
        ))}
      </div>

      {open && (
        <div className="project-modal" role="dialog" aria-modal="true">
          <button
            className="modal-backdrop"
            aria-label="Close article"
            onClick={() => setOpen(null)}
          />
          <article className="modal-panel">
            <button className="modal-close" aria-label="Close" onClick={() => setOpen(null)}>
              ×
            </button>
            {open.coverImage && (
              <div className="modal-hero">
                <img src={open.coverImage} alt="" />
                <div className="modal-title">
                  <h2>{pick(open.titleEn, open.titleAr)}</h2>
                </div>
              </div>
            )}
            <div className="modal-content">
              {!open.coverImage && <h2 className="article-plain-title">{pick(open.titleEn, open.titleAr)}</h2>}

              <div className="article-author large">
                {open.authorPhoto ? (
                  <img src={open.authorPhoto} alt="" />
                ) : (
                  <span className="article-avatar">{open.authorName.charAt(0)}</span>
                )}
                <div>
                  <strong>{open.authorName}</strong>
                  {open.authorPhone && (
                    <a href={`tel:${open.authorPhone.replace(/\s/g, "")}`}>{open.authorPhone}</a>
                  )}
                </div>
              </div>

              <div className="article-text" dir={lang === "ar" && open.bodyAr ? "rtl" : "ltr"}>
                {pick(open.bodyEn, open.bodyAr)
                  .split("\n")
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}
