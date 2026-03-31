import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FUNDATRADE — Analyse fondamentale & Technique",
  description: "Plateforme d'analyse avancée BTC & Or · Prédictions hebdomadaires · Signaux temps réel.",
  keywords: ["trading", "bitcoin", "or", "XAUUSD", "analyse technique", "prédiction hebdomadaire"],
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('ft-theme')||'dark';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
        }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
