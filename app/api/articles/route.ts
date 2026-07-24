import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { dbErrorMessage, isAuthorised, unauthorised } from "@/lib/admin-auth";

const SCOPES = ["project", "developer", "area"];

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const scope = params.get("scope");
    const scopeRef = params.get("scopeRef");
    const admin = await isAuthorised(request);

    const filters = [];
    if (!admin) filters.push(eq(articles.published, 1));
    if (scope) filters.push(eq(articles.scope, scope));
    if (scopeRef) filters.push(eq(articles.scopeRef, scopeRef));

    const db = await getDb();
    const rows = await db
      .select()
      .from(articles)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(articles.createdAt), desc(articles.id))
      .limit(200);

    return Response.json({ articles: rows });
  } catch (error) {
    return Response.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await isAuthorised(request))) return unauthorised();

    const body = (await request.json()) as Record<string, unknown>;
    const titleEn = String(body.titleEn || "").trim();
    const authorName = String(body.authorName || "").trim();
    const scope = String(body.scope || "").trim();

    if (!titleEn) return Response.json({ error: "English title is required" }, { status: 400 });
    if (!authorName) return Response.json({ error: "Author name is required" }, { status: 400 });
    if (!SCOPES.includes(scope)) {
      return Response.json({ error: "Scope must be project, developer or area" }, { status: 400 });
    }

    const base = slugify(titleEn) || `article-${Date.now()}`;
    const slug = `${base}-${Date.now().toString(36).slice(-4)}`;

    const db = await getDb();
    const [row] = await db
      .insert(articles)
      .values({
        slug,
        scope,
        scopeRef: String(body.scopeRef || "").trim(),
        titleEn,
        titleAr: String(body.titleAr || "").trim(),
        excerptEn: String(body.excerptEn || "").trim(),
        excerptAr: String(body.excerptAr || "").trim(),
        bodyEn: String(body.bodyEn || "").trim(),
        bodyAr: String(body.bodyAr || "").trim(),
        coverImage: String(body.coverImage || "").trim(),
        authorName,
        authorPhoto: String(body.authorPhoto || "").trim(),
        authorPhone: String(body.authorPhone || "").trim(),
        published: body.published === false ? 0 : 1,
      })
      .returning();

    return Response.json({ article: row }, { status: 201 });
  } catch (error) {
    return Response.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}
