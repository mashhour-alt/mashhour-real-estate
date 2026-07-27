const allowedSource = (value: string) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "www.propertyfinder.ae" || url.hostname === "propertyfinder.ae") &&
      url.pathname.startsWith("/en/new-projects/")
    );
  } catch {
    return false;
  }
};

const mediaItem = (item: unknown) => {
  if (typeof item === "string") return { url: item, preview: item, type: "image" };
  if (!item || typeof item !== "object") return null;
  const record = item as {
    source?: string;
    type?: string;
    variants?: { medium?: string };
  };
  if (!record.source && !record.variants?.medium) return null;
  return {
    url: record.source || record.variants?.medium || "",
    preview: record.variants?.medium || record.source || "",
    type: record.type || "image",
  };
};

export async function GET(request: Request) {
  const encodedSource = new URL(request.url).searchParams.get("source");
  let source = "";
  try {
    source = encodedSource ? atob(encodedSource) : "";
  } catch {
    source = "";
  }
  if (!source || !allowedSource(source)) {
    return Response.json({ error: "Invalid source" }, { status: 400 });
  }

  try {
    const response = await fetch(source, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "accept-language": "en-AE,en;q=0.9",
        "user-agent": "MashhourRealEstate/1.0",
      },
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as RequestInit);
    if (!response.ok) {
      return Response.json({ error: "Project source unavailable" }, { status: 404 });
    }

    const html = await response.text();
    const nextData = html.match(
      /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
    );
    if (!nextData?.[1]) {
      return Response.json({ error: "Project data unavailable" }, { status: 404 });
    }

    const payload = JSON.parse(nextData[1]);
    const detail = payload?.props?.pageProps?.detailResult;
    if (!detail) {
      return Response.json({ error: "Project data unavailable" }, { status: 404 });
    }

    const media = (detail.images || []).map(mediaItem).filter(Boolean);
    const unitOptions = (detail.units || []).flatMap(
      (building: { units?: Array<{ propertyType?: string; list?: unknown[] }> }) =>
        (building.units || []).flatMap((group) =>
          (group.list || []).map((unit: unknown) => ({
            propertyType: group.propertyType || null,
            ...(unit as object),
          })),
        ),
    );

    return Response.json(
      {
        title: detail.title || null,
        developer: detail.developer || null,
        location: detail.location || null,
        amenities: (detail.amenities || []).map((item: { name?: string }) => item.name).filter(Boolean),
        media,
        brochureUrl: detail.brochureUrl || null,
        masterPlan: detail.masterPlan
          ? { image: detail.masterPlan.image || null }
          : null,
        paymentPlans: detail.paymentPlans || [],
        propertyTypes: detail.propertyTypes || [],
        deliveryDate: detail.deliveryDate || null,
        startingPrice: detail.startingPrice ?? null,
        stockAvailability: detail.stockAvailability || null,
        constructionPhase: detail.constructionPhase || null,
        constructionProgress: detail.constructionProgress ?? null,
        ownershipType: detail.ownershipType || null,
        unitOptions,
      },
      {
        headers: {
          "cache-control": "public, max-age=3600, s-maxage=86400",
        },
      },
    );
  } catch {
    return Response.json({ error: "Project data unavailable" }, { status: 404 });
  }
}
