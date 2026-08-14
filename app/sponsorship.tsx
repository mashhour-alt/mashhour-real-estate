"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./language-context";

export type Campaign = {
  campaignId: string;
  developerName: string;
  projectNames: string[];
  startDate: string;
  endDate: string;
  placementType: "featured-project" | "featured-developer" | "area-feature" | "directory" | "homepage";
  status: "active" | "paused" | "ended";
};

export type SponsorshipData = {
  featuredProjects: string[];
  featuredDevelopers: string[];
  campaigns: Campaign[];
};

const EMPTY: SponsorshipData = { featuredProjects: [], featuredDevelopers: [], campaigns: [] };

/**
 * Paid placements are read from a static file so a campaign can go live without a
 * code change. Nothing here reorders results: sponsorship only adds a visible
 * label, never a ranking advantage.
 */
export function useSponsorship() {
  const [data, setData] = useState<SponsorshipData>(EMPTY);

  useEffect(() => {
    fetch("/data/sponsorships.json")
      .then((response) => response.json())
      .then((parsed: Partial<SponsorshipData>) => {
        const today = new Date().toISOString().slice(0, 10);
        const activeCampaigns = (parsed.campaigns || []).filter(
          (campaign) =>
            campaign.status === "active" &&
            campaign.startDate <= today &&
            campaign.endDate >= today,
        );
        // A project is only treated as sponsored while its campaign window is open.
        const campaignProjects = activeCampaigns.flatMap((campaign) => campaign.projectNames || []);
        const campaignDevelopers = activeCampaigns.map((campaign) => campaign.developerName).filter(Boolean);
        setData({
          featuredProjects: Array.from(new Set([...(parsed.featuredProjects || []), ...campaignProjects])),
          featuredDevelopers: Array.from(new Set([...(parsed.featuredDevelopers || []), ...campaignDevelopers])),
          campaigns: activeCampaigns,
        });
      })
      .catch(() => setData(EMPTY));
  }, []);

  return data;
}

export function SponsoredLabel({ variant = "project" }: { variant?: "project" | "developer" }) {
  const { arabic } = useLanguage();
  return (
    <span className="sponsored-label" title={arabic ? "محتوى مدفوع — ليس ترشيحاً تحريرياً" : "Paid placement — not an editorial recommendation"}>
      {arabic
        ? (variant === "developer" ? "مطوّر — محتوى مدفوع" : "إعلان / محتوى مدفوع")
        : (variant === "developer" ? "Developer — Sponsored" : "Featured — Sponsored")}
    </span>
  );
}
