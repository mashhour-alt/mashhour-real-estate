"use client";

import { useState, type FormEvent } from "react";
import { useLang } from "@/lib/site-context";

export default function LeadSection() {
  const { t } = useLang();
  const [sent, setSent] = useState(false);

  const submitLead = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
  };

  return (
    <section className="lead-section">
      <div>
        <p>MASHHOUR REAL ESTATE</p>
        <h2>{t.leadTitle}</h2>
        <span>{t.leadSub}</span>
      </div>
      <form onSubmit={submitLead}>
        <input required placeholder={t.name} />
        <input required type="tel" placeholder={t.phone} />
        <input required type="email" placeholder={t.email} />
        <select defaultValue="">
          <option value="" disabled>
            {t.budget}
          </option>
          <option>Under AED 1M</option>
          <option>AED 1M–2M</option>
          <option>AED 2M–5M</option>
          <option>AED 5M+</option>
        </select>
        <button>{t.send} ↗</button>
        {sent && <p className="success">{t.success}</p>}
      </form>
    </section>
  );
}
