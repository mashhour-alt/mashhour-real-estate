"use client";

import { ContactDock, DataNotice, Footer, Header, LeadSection, usePlatformData } from "./components";
import { projectImages } from "./data";

const destinations = [
  { href: "/projects", number: "01", title: "Projects", copy: "Search Dubai off-plan inventory with focused filters and complete project pages.", image: projectImages[0] },
  { href: "/map", number: "02", title: "Interactive map", copy: "Explore projects spatially with verified coordinates and clear mobile controls.", image: projectImages[1] },
  { href: "/areas", number: "03", title: "Areas", copy: "Understand communities, benchmarks, articles and every linked project.", image: projectImages[2] },
  { href: "/developers", number: "04", title: "Developers", copy: "Review developer profiles, official links and structured track records.", image: projectImages[3] },
  { href: "/compare", number: "05", title: "Compare", copy: "Put the numbers, payment plans and handover dates side by side.", image: projectImages[4] },
  { href: "/calculators", number: "06", title: "ROI / ROE", copy: "Model investment returns using the dedicated calculator workspace.", image: projectImages[5] },
];

export default function Home() {
  const data = usePlatformData();
  return (
    <main>
      <Header />
      <section className="home-hero">
        <div className="home-copy">
          <p className="eyebrow"><span />DUBAI OFF-PLAN INTELLIGENCE</p>
          <h1>Every decision.<br /><em>In its right place.</em></h1>
          <p>Projects, developers, areas, map intelligence and investment tools—now separated into focused pages built for desktop and mobile.</p>
          <div className="hero-actions"><a className="button primary" href="/projects">Explore projects <b>↗</b></a><a className="button ghost" href="/map">Open the map <b>→</b></a></div>
        </div>
        <div className="home-visual">
          <img src={projectImages[0]} alt="Dubai luxury architecture" />
          <div className="home-visual-shade" />
          <span>CURATED<br /><strong>DUBAI</strong></span>
          <div className="hero-property-note"><small>MARKET INTELLIGENCE</small><strong>One clear view of Dubai off-plan.</strong></div>
        </div>
      </section>
      <section className="home-stats">
        <div><strong>{data?.projects.length.toLocaleString() || "—"}</strong><span>projects</span></div>
        <div><strong>{data?.developers.length.toLocaleString() || "—"}</strong><span>developers</span></div>
        <div><strong>{data?.areas.length.toLocaleString() || "—"}</strong><span>area benchmarks</span></div>
        <div><strong>1</strong><span>structured reference</span></div>
      </section>
      <section className="destination-section">
        <div className="section-kicker"><span>THE PLATFORM</span><h2>Choose your workspace.</h2></div>
        <div className="destination-grid">
          {destinations.map((item) => (
            <a className="destination-card" href={item.href} key={item.href}>
              <div className="destination-image"><img src={item.image} alt="" loading="lazy" /><span>{item.number}</span></div>
              <div className="destination-copy"><div><h3>{item.title}</h3><p>{item.copy}</p></div><b>↗</b></div>
            </a>
          ))}
        </div>
      </section>
      <DataNotice />
      <LeadSection />
      <Footer />
      <ContactDock />
    </main>
  );
}
