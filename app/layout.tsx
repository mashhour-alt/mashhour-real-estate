import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "./language-context";

export const metadata: Metadata = {
  metadataBase: new URL("https://mashhour-real-estate.mashhour.workers.dev"),
  title: {
    default: "Mashhour Real Estate | عقارات دبي على الخريطة",
    template: "%s | Mashhour Real Estate",
  },
  description:
    "منصة مشهور للعقارات: دليل ذكي لمشاريع دبي على الخريطة (Off-Plan). خريطة تفاعلية بأكثر من 2,400 مشروع، تقييمات المطورين، أدلة المناطق، وحاسبة العائد على الاستثمار.",
  keywords: [
    "عقارات دبي",
    "مشاريع دبي على الخريطة",
    "استثمار عقاري دبي",
    "off-plan Dubai",
    "Dubai real estate",
    "Mashhour Real Estate",
  ],
  authors: [{ name: "Mahmoud Mashhour" }],
  openGraph: {
    type: "website",
    title: "Mashhour Real Estate | عقارات دبي على الخريطة",
    description: "دليل ذكي لمشاريع دبي على الخريطة: خريطة تفاعلية، تقييمات المطورين، وحاسبة العائد.",
    siteName: "Mashhour Real Estate",
    locale: "ar_AE",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "QqHbPgg2s2NRKRYWUeva35YUUDKB4ZZl1cYqqWLtBF8",
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
