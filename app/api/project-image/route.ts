const allowedHost = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "www.propertyfinder.ae" ||
      url.hostname === "propertyfinder.ae"
    );
  } catch {
    return false;
  }
};

const decodeHtml = (value: string) =>
  value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'");

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get("url");
  if (!source || !allowedHost(source)) {
    return new Response("Invalid source", { status: 400 });
  }

  try {
    const response = await fetch(source, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-AE,en;q=0.9",
        "user-agent": "Mozilla/5.0 (compatible; MashhourRealEstate/1.0)",
      },
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as RequestInit);
    if (!response.ok) return new Response("Image source unavailable", { status: 404 });

    const html = await response.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!match?.[1]) return new Response("Project image unavailable", { status: 404 });

    const imageUrl = decodeHtml(match[1]);
    return Response.redirect(imageUrl, 302);
  } catch {
    return new Response("Project image unavailable", { status: 404 });
  }
}
