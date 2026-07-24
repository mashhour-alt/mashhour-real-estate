import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Articles attached to a project, developer or area.
 * `scope` says which page type the article belongs to and `scopeRef` holds the
 * matching name from offplan.json (e.g. "Business Bay", "Emaar Properties").
 */
export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),

  scope: text("scope").notNull(), // "project" | "developer" | "area"
  scopeRef: text("scope_ref").notNull().default(""),

  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar").notNull().default(""),
  excerptEn: text("excerpt_en").notNull().default(""),
  excerptAr: text("excerpt_ar").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyAr: text("body_ar").notNull().default(""),

  coverImage: text("cover_image").notNull().default(""),

  authorName: text("author_name").notNull(),
  authorPhoto: text("author_photo").notNull().default(""),
  authorPhone: text("author_phone").notNull().default(""),

  published: integer("published").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ArticleRow = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

/**
 * Small key/value store. Currently holds the hashed admin password so the
 * dashboard can be protected without depending on platform-level secrets.
 */
export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
