import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lernwege – EDUTECSOL",
  description: "Differenzierte, interaktive Lernseiten für Schweizer Schulen",
  icons: { icon: "/favicon-32.png", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <head>
        {/* Gemeinsames Designsystem mit den statischen Seiten (public/lw.css, selbst gehostete Schriften) */}
        <link rel="preload" href="/fonts/fraunces-latin-wght-normal.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/lw.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
