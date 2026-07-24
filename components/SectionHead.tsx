"use client";

import type { ReactNode } from "react";

export default function SectionHead({
  number,
  eyebrow,
  title,
  sub,
  aside,
  inverse,
}: {
  number: string;
  eyebrow: string;
  title: string;
  sub?: string;
  aside?: ReactNode;
  inverse?: boolean;
}) {
  return (
    <div className={inverse ? "section-head inverse" : "section-head"}>
      <div>
        <span className="section-number">{number}</span>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
        {sub && <small>{sub}</small>}
      </div>
      {aside}
    </div>
  );
}
