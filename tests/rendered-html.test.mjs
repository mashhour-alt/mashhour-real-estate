import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

async function render(worker, pathname) {
  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders every public route successfully", async () => {
  const worker = await loadWorker();
  const routes = ["/", "/projects", "/projects/detail", "/map", "/compare", "/areas", "/developers", "/articles", "/calculators"];
  for (const route of routes) {
    const response = await render(worker, route);
    assert.equal(response.status, 200, `${route} returned ${response.status}`);
    assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
    assert.match(await response.text(), developmentPreviewMeta);
  }
});

test("catalogue has unique named projects and valid verified coordinates", async () => {
  const catalogue = JSON.parse(await readFile(new URL("../public/data/project-catalog.json", import.meta.url), "utf8"));
  const verifications = JSON.parse(await readFile(new URL("../public/data/google-maps-coordinate-verifications.json", import.meta.url), "utf8"));
  const names = catalogue.projects.map((project) => project["Project Name | اسم المشروع"]);

  assert.equal(names.length, new Set(names).size, "catalogue contains duplicate project names");
  assert.ok(names.every((name) => typeof name === "string" && name.trim()), "catalogue contains a blank project name");
  for (const [name, record] of Object.entries(verifications)) {
    assert.ok(names.includes(name), `verified coordinate is not tied to a catalogue project: ${name}`);
    assert.ok(record.coordinates.lat >= 22 && record.coordinates.lat <= 27, `${name} latitude is outside the UAE`);
    assert.ok(record.coordinates.lng >= 51 && record.coordinates.lng <= 57, `${name} longitude is outside the UAE`);
  }
});
