"use client";

import { Footer, Header, PageIntro } from "../components";
import { useLanguage } from "../language-context";

const whatsapp = (message: string) => `https://wa.me/971582239619?text=${encodeURIComponent(message)}`;

export default function PartnersPage() {
  const { arabic } = useLanguage();

  const options = [
    {
      titleAr: "ملف مطور موثّق",
      titleEn: "Verified Developer Profile",
      copyAr: "راجع بيانات شركتك، اربط موقعك الرسمي، ووثّق الملف عشان يظهر كمصدر معتمد.",
      copyEn: "Review your company data, link your official website and verify the profile so it reads as an approved source.",
    },
    {
      titleAr: "مطوّر مميّز",
      titleEn: "Featured Developer",
      copyAr: "ظهور بعلامة \"محتوى مدفوع\" واضحة في دليل المطورين.",
      copyEn: "Placement in the developer directory with a clear paid-content label.",
    },
    {
      titleAr: "مشاريع مميّزة",
      titleEn: "Featured Projects",
      copyAr: "إبراز مشاريع محددة داخل دليل المشاريع، بوسم إعلاني ظاهر.",
      copyEn: "Highlight specific projects inside the project directory, always visibly labelled.",
    },
    {
      titleAr: "حضور في صفحة منطقة",
      titleEn: "Sponsored Area Presence",
      copyAr: "وجود مدفوع داخل صفحة المنطقة اللي مشاريعك موجودة فيها.",
      copyEn: "Paid presence inside the area pages where your projects are located.",
    },
    {
      titleAr: "فرص عملاء مؤهلين",
      titleEn: "Qualified Lead Opportunities",
      copyAr: "استفسارات جاية من مستخدم بيقارن فعلاً قبل قرار الشراء.",
      copyEn: "Enquiries from users who are actively comparing before a purchase decision.",
    },
    {
      titleAr: "محتوى تحريري مموّل",
      titleEn: "Sponsored Content",
      copyAr: "مقال تفصيلي عن المشروع، موسوم بوضوح كمحتوى مدفوع.",
      copyEn: "An in-depth project article, clearly marked as paid content.",
    },
  ];

  return (
    <main>
      <Header />
      <PageIntro
        eyebrow={arabic ? "شراكات المطورين" : "DEVELOPER PARTNERSHIPS"}
        title={arabic ? "ضع مشاريعك أمام مَن يقارن قبل الشراء." : "Put your projects in front of buyers who compare first."}
        intro={
          arabic
            ? "مشهور العقارية منصة بيانات ومقارنة لمشاريع دبي على الخريطة. المستخدم بيوصل هنا وهو بيدوّر ويقارن — مش بيتصفّح إعلانات."
            : "Mashhour Real Estate is a data and comparison platform for Dubai off-plan projects. Users arrive here researching and comparing — not browsing adverts."
        }
      />

      <section className="page-body">
        <div className="partner-principles">
          <div>
            <strong>{arabic ? "الإعلان دايماً موسوم" : "Placements are always labelled"}</strong>
            <p>{arabic ? "أي مساحة مدفوعة بتظهر بوسم \"إعلان / محتوى مدفوع\" واضح." : "Every paid placement carries a visible \"Sponsored\" label."}</p>
          </div>
          <div>
            <strong>{arabic ? "الرعاية مبتغيّرش الترتيب" : "Sponsorship does not change ranking"}</strong>
            <p>{arabic ? "المشروع المموّل مبيكسبش المقارنة ومبيتقدّمش في نتائج البحث." : "A sponsored project never wins a comparison or moves up in search results."}</p>
          </div>
          <div>
            <strong>{arabic ? "البيانات بتفضل مستقلة" : "The data stays independent"}</strong>
            <p>{arabic ? "الأسعار والتسليم والمصادر بتتعرض زي ما هي، سواء فيه شراكة أو لأ." : "Prices, handover dates and sources are shown as they are, partnership or not."}</p>
          </div>
        </div>

        <h2 className="partner-section-title">{arabic ? "خيارات الشراكة" : "Partnership options"}</h2>
        <div className="partner-grid">
          {options.map((option, index) => (
            <article key={option.titleEn}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{arabic ? option.titleAr : option.titleEn}</h3>
              <p>{arabic ? option.copyAr : option.copyEn}</p>
            </article>
          ))}
        </div>

        <div className="partner-cta">
          <div>
            <h2>{arabic ? "تحدث معنا عن الشراكة" : "Talk to us about a partnership"}</h2>
            <p>
              {arabic
                ? "ابعتلنا اسم الشركة ودورك والمشاريع اللي مهتم تبرزها، وهنرجعلك بالخيارات المتاحة والتسعير."
                : "Send us your company, your role and the projects you want to highlight, and we will come back with available options and pricing."}
            </p>
          </div>
          <div className="partner-cta-actions">
            <a
              className="button primary"
              href={whatsapp(
                arabic
                  ? "مرحباً محمود، أنا مهتم بشراكة تسويقية على منصة مشهور العقارية.\n\nالاسم:\nالشركة / المطور:\nالمسمى الوظيفي:\nالبريد الإلكتروني:\nنوع الشراكة المهتم بها:"
                  : "Hi Mahmoud, I am interested in a partnership on Mashhour Real Estate.\n\nName:\nDeveloper / Company:\nJob title:\nWork email:\nPartnership interest:",
              )}
              target="_blank"
              rel="noreferrer"
            >
              {arabic ? "تواصل على واتساب ↗" : "Message on WhatsApp ↗"}
            </a>
            <a
              className="button ghost"
              href={`mailto:mahmoudmashhournasr@gmail.com?subject=${encodeURIComponent(
                arabic ? "استفسار شراكة مطوّر" : "Developer partnership enquiry",
              )}&body=${encodeURIComponent(
                arabic
                  ? "الاسم:\nالشركة / المطور:\nالمسمى الوظيفي:\nرقم الهاتف:\nنوع الشراكة المهتم بها:\nرسالتك:"
                  : "Name:\nDeveloper / Company:\nJob title:\nPhone:\nPartnership interest:\nMessage:",
              )}`}
            >
              {arabic ? "أرسل بريد إلكتروني ↗" : "Send an email ↗"}
            </a>
          </div>
        </div>

        <p className="partner-footnote">
          {arabic
            ? "الأسعار بتتحدد حسب نوع الشراكة ومدتها ولسه مش منشورة. التقارير بتشمل ظهور المشروع والزيارات والاستفسارات."
            : "Pricing depends on placement type and duration and is not published yet. Reporting covers project visibility, page views and enquiries."}
        </p>
      </section>
      <Footer />
    </main>
  );
}
