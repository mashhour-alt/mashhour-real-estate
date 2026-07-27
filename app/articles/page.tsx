import { Footer, Header, PageIntro } from "../components";

const categories = [["Project guides", "Launch analysis, payment plans and the facts behind individual projects."], ["Developer profiles", "Track records, delivery context and interviews with Dubai developers."], ["Area guides", "Lifestyle, connectivity, supply, pricing and investment context by community."]];

export default function ArticlesPage() {
  return <main><Header /><PageIntro eyebrow="EDITORIAL INTELLIGENCE" title="Research with a name behind it." intro="Every article will show its author, portrait and direct contact number, and will connect naturally to the relevant project, developer or area." /><section className="editorial-grid">{categories.map((item, index) => <article key={item[0]}><span>0{index + 1}</span><p>COMING IN PHASE 03</p><h2>{item[0]}</h2><strong>{item[1]}</strong><div><i>MM</i><small>Author profile and contact</small></div></article>)}</section><Footer /></main>;
}

