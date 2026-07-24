import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { articles } from "@/db/schema";
import { dbErrorMessage, isAuthorised, unauthorised } from "@/lib/admin-auth";

const FIELDS = [
  "scope",
  "scopeRef",
  "titleEn",
  "titleAr",
  "excerptEn",
  "excerptAr",
  "bodyEn",
  "bodyAr",
  "coverImage",
  "authorName",
  "authorPhoto",
  "authorPhone",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAuthorised(request))) return unauthorised();

    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const patch: Record<string, string | number> = {
      updatedAt: new Date().toISOString(),
    };

    for (const field of FIELDS) {
      if (body[field] !== undefined) patch[field] = String(body[field]).trim();
    }
    if (body.published !== undefined) patch.published = body.published ? 1 : 0;

    const db = await getDb();
    const [row] = await db
      .update(articles)
      .set(patch)
      .where(eq(articles.id, numericId))
      .returning();

    if (!row) return Response.json({ error: "Article not found" }, { status: 404 });
    return Response.json({ article: row });
  } catch (error) {
    return Response.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAuthorised(request))) return unauthorised();

    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId)) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const db = await getDb();
    await db.delete(articles).where(eq(articles.id, numericId));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: dbErrorMessage(error) }, { status: 500 });
  }
}
