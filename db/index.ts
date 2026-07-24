import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Minimal shape of the D1 binding we rely on. Using a local type avoids adding
 * the full @cloudflare/workers-types dependency just for one interface.
 */
type D1Like = Parameters<typeof drizzle>[0];

/**
 * Returns a Drizzle client bound to the Cloudflare D1 database.
 *
 * The `cloudflare:workers` module only exists inside the Workers runtime, so it
 * is imported dynamically here. A static top-level import would be evaluated by
 * the plain-Node build/validation step, which cannot resolve that scheme.
 */
export async function getDb() {
  const { env } = (await import("cloudflare:workers")) as {
    env: { DB?: D1Like };
  };

  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
