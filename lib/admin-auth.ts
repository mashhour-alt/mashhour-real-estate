import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";

const PASSWORD_KEY = "admin_password";
const HEADER = "x-admin-password";

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

async function hash(password: string, salt: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await crypto.subtle.digest("SHA-256", data));
}

/** Stored as `salt:sha256(salt:password)` so the plain password is never kept. */
export async function encodePassword(password: string) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)).buffer);
  return `${salt}:${await hash(password, salt)}`;
}

/** Constant-time-ish comparison to avoid leaking timing information. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function storedPassword() {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, PASSWORD_KEY))
    .limit(1);
  return row?.value || "";
}

/** True when no admin password has been set yet — the dashboard is in setup mode. */
export async function isSetupNeeded() {
  return !(await storedPassword());
}

export async function setPassword(password: string) {
  const db = await getDb();
  const encoded = await encodePassword(password);
  const existing = await storedPassword();
  if (existing) {
    await db.update(settings).set({ value: encoded }).where(eq(settings.key, PASSWORD_KEY));
  } else {
    await db.insert(settings).values({ key: PASSWORD_KEY, value: encoded });
  }
}

export async function checkPassword(password: string) {
  if (!password) return false;
  const stored = await storedPassword();
  if (!stored) return false;
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  return safeEqual(await hash(password, salt), digest);
}

/** Reads the password header off a request and validates it. */
export async function isAuthorised(request: Request) {
  return checkPassword(request.headers.get(HEADER) || "");
}

export const unauthorised = () =>
  Response.json({ error: "Not authorised" }, { status: 401 });

/** Turns raw D1 failures into a message that says what to do next. */
export function dbErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : "";
  const combined = `${message}\n${cause}`;

  if (combined.includes("binding `DB` is unavailable")) {
    return "Database is not connected yet. Set \"d1\": \"DB\" in .openai/hosting.json and redeploy.";
  }
  if (combined.includes("no such table")) {
    return "Tables are missing. Commit the files in drizzle/ and redeploy so the migration runs.";
  }
  return message;
}
