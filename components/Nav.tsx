"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ROUTES } from "@/lib/copy";
import { useCompare, useLang } from "@/lib/site-context";
import type { Lang } from "@/lib/types";

export default function Nav() {
  const { lang, setLang, t } = useLang();
  const { compare } = useCompare();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeDrawer = () => setOpen(false);

  // Lock body scroll and allow Escape to close while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [open]);

  const links = ROUTES.map((route, index) => ({
    href: route.href,
    label: t.nav[index],
    badge: route.href === "/compare" && compare.length > 0 ? compare.length : null,
  }));

  const langButtons = (["en", "ar", "it"] as Lang[]).map((item) => (
    <button
      key={item}
      className={lang === item ? "active" : ""}
      onClick={() => setLang(item)}
      aria-pressed={lang === item}
    >
      {item.toUpperCase()}
    </button>
  ));

  return (
    <>
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Mashhour Real Estate home">
          <span className="logo-window">
            <img src="/assets/mashhour-black.png" alt="Mashhour Real Estate" />
          </span>
          <span>REAL ESTATE</span>
        </Link>

        <nav>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? "active" : ""}
            >
              {link.label}
              {link.badge && <b className="nav-badge">{link.badge}</b>}
            </Link>
          ))}
        </nav>

        <div className="topbar-end">
          <div className="lang-switch" aria-label="Language">
            {langButtons}
          </div>
          <button
            className="nav-toggle"
            onClick={() => setOpen(true)}
            aria-label={t.menu}
            aria-expanded={open}
          >
            <i />
            <i />
            <i />
            {compare.length > 0 && <b className="nav-badge">{compare.length}</b>}
          </button>
        </div>
      </header>

      <div className={open ? "mobile-nav open" : "mobile-nav"} aria-hidden={!open}>
        <button
          className="mobile-nav-backdrop"
          aria-label={t.close}
          tabIndex={open ? 0 : -1}
          onClick={closeDrawer}
        />
        <div className="mobile-nav-panel" role="dialog" aria-modal="true" aria-label={t.menu}>
          <div className="mobile-nav-head">
            <span>{t.menu}</span>
            <button onClick={closeDrawer} aria-label={t.close}>
              ×
            </button>
          </div>

          <nav className="mobile-nav-links">
            <Link
              href="/"
              className={pathname === "/" ? "active" : ""}
              tabIndex={open ? 0 : -1}
              onClick={closeDrawer}
            >
              <span>00</span>
              <strong>{t.home}</strong>
            </Link>
            {links.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={pathname === link.href ? "active" : ""}
                tabIndex={open ? 0 : -1}
                onClick={closeDrawer}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{link.label}</strong>
                {link.badge && <b className="nav-badge">{link.badge}</b>}
              </Link>
            ))}
          </nav>

          <div className="mobile-nav-foot">
            <small>LANGUAGE</small>
            <div className="lang-switch">{langButtons}</div>
          </div>
        </div>
      </div>
    </>
  );
}
