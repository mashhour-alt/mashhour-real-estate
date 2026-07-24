"use client";

import Link from "next/link";
import { useLang } from "@/lib/site-context";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer>
      <Link className="brand footer-brand" href="/">
        <span className="logo-window">
          <img src="/assets/mashhour-white.png" alt="Mashhour Real Estate" />
        </span>
        <span>REAL ESTATE</span>
      </Link>
      <p>{t.footerLine}</p>
      <span>© 2026 Mashhour Real Estate</span>
    </footer>
  );
}
