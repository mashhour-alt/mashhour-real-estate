"use client";

import { useEffect, useMemo, useState } from "react";
import { Footer, Header, PageIntro, SearchBox } from "../components";
import { useLanguage } from "../language-context";

type Article = {
  slug: string;
  title: string;
  titleEn?: string;
  category: string;
  excerpt: string;
  author: string;
  authorTitle?: string;
  authorPhoto?: string;
  date: string;
  readMinutes?: number;
  cover?: string;
};

export default function ArticlesPage() {
  const { arabic } = useLanguage();
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
        eyebrow={arabic ? "ذكاء تحريري" : "EDITORIAL INTELLIGENCE"}
        title={arabic ? "أبحاث لها اسم وراها." : "Research with a name behind it."}
        intro={arabic ? "كل مقال بيظهر فيه اسم الكاتب وصورته ورقم تواصل مباشر، ومرتبط بالمشروع أو المطور أو المنطقة المعنية." : "Every article shows its author, portrait and direct contact number, and connects to the relevant project, developer or area."}
        action={<strong className="page-count">{filtered.length} {arabic ? "مقال" : "ARTICLES"}</strong>}
      />
      <section className="page-body">
        <SearchBox value={query} onChange={setQuery} placeholder={arabic ? "ابحث في المقالات" : "Search articles"} />
        {filtered.length === 0 ? (
          <p style={{ padding: "40px 0", color: "#777", fontSize: 13 }}>
            {arabic ? <>لا توجد مقالات بعد. أضف مقالك الأول في ملف <code>public/data/articles.json</code>.</> : <>No articles yet. Add your first article in <code>public/data/articles.json</code>.</>}
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
                  {item.authorPhoto ? <img className="area-directory-author-photo" src={item.authorPhoto} alt={item.author} /> : null}
                  <div><strong>{item.author}</strong><small>{item.authorTitle || (arabic ? "كاتب" : "Author")}</small></div>
                </div>
                <div>
                  <strong>{item.readMinutes || 4} {arabic ? "دقيقة" : "min"}</strong>
                  <small>{item.date}</small>
                </div>
                <b>{arabic ? "اقرأ المقال ↗" : "Read article ↗"}</b>
              </a>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
