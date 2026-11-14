import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lernwege – EDUTECSOL",
  description: "Differenzierte, interaktive Lernseiten für Schweizer Schulen",
  icons: { icon: "/favicon-32.png", apple: "/apple-touch-icon.png" },
  // Vorschau beim Teilen (LinkedIn, Teams, Mail)
  metadataBase: new URL("https://lernwege.edutecsol.ch"),
  openGraph: {
    type: "website",
    siteName: "Lernwege von EDUTECSOL",
    locale: "de_CH",
    images: [{ url: "/img/og-lernwege.jpg", width: 1200, height: 630, alt: "Lernwege: interaktive Lernseiten für den Unterricht" }],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <head>
        {/* Gemeinsames Designsystem mit den statischen Seiten (public/lw.css, selbst gehostete Schriften) */}
        <link rel="preload" href="/fonts/source-serif-4-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/lw.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
