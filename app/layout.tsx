import type { Metadata } from "next";
import { ACTIVE_SITE_URL, BRAND_NAME } from "./brand";
import "./globals.css";
import { LanguageProvider } from "./language-context";

export const metadata: Metadata = {
  metadataBase: new URL(ACTIVE_SITE_URL),
  title: {
    default: "MAS MAP | عقارات دبي على الخريطة",
    template: "%s | MAS MAP",
  },
  description:
    "منصة MAS MAP: دليل ذكي لمشاريع دبي على الخريطة (Off-Plan). خريطة تفاعلية بأكثر من 2,400 مشروع، تقييمات المطورين، أدلة المناطق، وحاسبة العائد على الاستثمار.",
  keywords: [
    "عقارات دبي",
    "مشاريع دبي على الخريطة",
    "استثمار عقاري دبي",
    "off-plan Dubai",
    "Dubai real estate",
    "MAS MAP",
  ],
  authors: [{ name: "Mahmoud Mashhour" }],
  openGraph: {
    type: "website",
    title: "MAS MAP | عقارات دبي على الخريطة",
    description: "دليل ذكي لمشاريع دبي على الخريطة: خريطة تفاعلية، تقييمات المطورين، وحاسبة العائد.",
    siteName: BRAND_NAME,
    images: [{ url: "/assets/mas-map-logo.png", width: 512, height: 512, alt: "MAS MAP" }],
    alternateLocale: ["en_AE", "it_IT"],
    locale: "ar_AE",
  },
  robots: { index: true, follow: true },
  verification: {
    google: "QqHbPgg2s2NRKRYWUeva35YUUDKB4ZZl1cYqqWLtBF8",
  },
  manifest: "/site.webmanifest",
  applicationName: BRAND_NAME,
  twitter: { card: "summary", title: BRAND_NAME, images: ["/assets/mas-map-logo.png"] },
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/favicon-16.png", sizes: "16x16", type: "image/png" }],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
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
