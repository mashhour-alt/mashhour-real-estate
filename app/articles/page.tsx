"use client";

import { useEffect, useMemo, useState } from "react";
import { Footer, Header, PageIntro, SearchBox } from "../components";

type Article = {
  slug: string;
  title: string;
  titleEn?: string;
  category: string;
  excerpt: string;
  author: string;
  authorTitle?: string;
  date: string;
  readMinutes?: number;
  cover?: string;
};

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/articles.json")
      .then((response) => response.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setArticles([]));
  }, []);

  const filtered = useMemo(
    () =>
      articles.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase()) ||
          item.excerpt.toLowerCase().includes(query.toLowerCase()),
      ),
    [articles, query],
  );

  return (
    <main>
      <Header />
      <PageIntro
        eyebrow="EDITORIAL INTELLIGENCE"
        title="Research with a name behind it."
        intro="Every article shows its author, portrait and direct contact number, and connects to the relevant project, developer or area."
        action={<strong className="page-count">{filtered.length} ARTICLES</strong>}
      />
      <section className="page-body">
        <SearchBox value={query} onChange={setQuery} placeholder="Search articles" />
        {filtered.length === 0 ? (
          <p style={{ padding: "40px 0", color: "#777", fontSize: 13 }}>
            لا توجد مقالات بعد. أضف مقالك الأول في ملف <code>public/data/articles.json</code>.
          </p>
        ) : (
          <div className="area-directory">
            {filtered.map((item, index) => (
              <a href={`/articles/${item.slug}`} key={item.slug}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p style={{ color: "var(--red)", fontSize: 8, fontWeight: 900, letterSpacing: ".13em", margin: "0 0 6px" }}>
                  {item.category}
                </p>
                <h2>{item.title}</h2>
                <p>{item.excerpt}</p>
                <div>
                  <strong>{item.author}</strong>
                  <small>{item.authorTitle || "Author"}</small>
                </div>
                <div>
                  <strong>{item.readMinutes || 4} min</strong>
                  <small>{item.date}</small>
                </div>
                <b>Read article ↗</b>
              </a>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
