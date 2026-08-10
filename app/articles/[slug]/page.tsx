"use client";

import { useEffect, useState } from "react";
import { Footer, Header } from "../../components";
import { useLanguage } from "../../language-context";

type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

type Article = {
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  author: string;
  authorTitle?: string;
  authorPhoto?: string;
  authorPhone?: string;
  date: string;
  readMinutes?: number;
  cover?: string;
  relatedArea?: string;
  body: Block[];
};

export default function ArticlePage() {
  const { arabic } = useLanguage();
  const [article, setArticle] = useState<Article | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Read the slug from the URL directly for reliable client-side routing.
    const parts = window.location.pathname.split("/").filter(Boolean);
    const slug = decodeURIComponent(parts[parts.length - 1] || "");
    fetch("/data/articles.json")
      .then((response) => response.json())
      .then((data: { articles: Article[] }) => {
        const found = (data.articles || []).find((item) => item.slug === slug);
        if (found) setArticle(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true));
  }, []);

  if (notFound) {
    return (
      <main>
        <Header />
        <section className="page-body" style={{ padding: "80px 0", textAlign: "center" }}>
          <h1>{arabic ? "المقال غير موجود" : "Article not found"}</h1>
          <p style={{ color: "#777" }}>
            <a href="/articles" style={{ color: "var(--red)" }}>{arabic ? "← ارجع لكل المقالات" : "← Back to all articles"}</a>
          </p>
        </section>
        <Footer />
      </main>
    );
  }

  if (!article) {
    return (
      <main>
        <Header />
        <section className="page-body" style={{ padding: "80px 0", textAlign: "center", color: "#777" }}>
          {arabic ? "جارٍ التحميل…" : "Loading…"}
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main>
      <Header />
      <article className="article-page">
        <div className="article-head">
          <a href="/articles" className="article-back">{arabic ? "← كل المقالات" : "← All articles"}</a>
          <p className="article-category">{article.category}</p>
          <h1>{article.title}</h1>
          <div className="article-author">
            {article.authorPhoto ? (
              <img className="article-author-photo" src={article.authorPhoto} alt={article.author} />
            ) : null}
            <div className="article-meta">
              <span><strong>{article.author}</strong>{article.authorTitle ? ` · ${article.authorTitle}` : ""}</span>
              <span>{article.date} · {article.readMinutes || 4} {arabic ? "دقائق قراءة" : "min read"}</span>
            </div>
          </div>
        </div>

        {article.cover ? (
          <div className="article-cover">
            <img src={article.cover} alt={article.title} />
          </div>
        ) : null}

        <div className="article-body">
          {article.body.map((block, index) => {
            if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
            if (block.type === "list")
              return (
                <ul key={index}>
                  {block.items.map((li, i) => <li key={i}>{li}</li>)}
                </ul>
              );
            return <p key={index}>{block.text}</p>;
          })}
        </div>

        <div className="article-cta">
          {article.authorPhone ? (
            <a
              className="article-cta-btn"
              href={`https://wa.me/${article.authorPhone}?text=${encodeURIComponent(arabic ? `مرحباً ${article.author}، قرأت مقال "${article.title}" وأود الاستفسار.` : `Hi ${article.author}, I read the article "${article.title}" and would like to ask a question.`)}`}
              target="_blank"
              rel="noreferrer"
            >
              {arabic ? `تواصل مع ${article.author} على واتساب ↗` : `Message ${article.author} on WhatsApp ↗`}
            </a>
          ) : null}
          {article.relatedArea ? (
            <a className="article-cta-alt" href={`/projects?area=${encodeURIComponent(article.relatedArea)}`}>
              {arabic ? `شوف مشاريع ${article.relatedArea} ↗` : `See ${article.relatedArea} projects ↗`}
            </a>
          ) : null}
        </div>
      </article>
      <Footer />
    </main>
  );
}
