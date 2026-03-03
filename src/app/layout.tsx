import type { Metadata } from "next";
import { Space_Mono, Syne } from "next/font/google";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fundatrade — Analyse fondamentale & Technique",
  description:
    "Plateforme d'analyse avancée pour crypto et or : fondamentaux, indicateurs techniques, prédiction IA en temps réel.",
  keywords: ["trading", "analyse fondamentale", "bitcoin", "crypto", "or", "XAUUSD", "RSI", "MACD", "SMC"],
  openGraph: {
    title: "Fundatrade",
    description: "Analyse fondamentale & technique pour traders",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Script inline pour éviter le flash de thème au chargement */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('fundatrade-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${syne.variable} ${spaceMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
