import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lernwege – EDUTECSOL",
  description: "Differenzierte, interaktive Lernseiten für die Schweizer Berufsbildung",
  icons: { icon: "/favicon-32.png", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH">
      <body>{children}</body>
    </html>
  );
}
