"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** The market section became /areas — keep the old path working. */
export default function MarketRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/areas");
  }, [router]);
  return (
    <section className="section light">
      <p className="page-loading">Redirecting to communities…</p>
    </section>
  );
}
