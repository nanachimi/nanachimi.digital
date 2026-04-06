import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE_CONFIG } from "@/lib/constants";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: `${SITE_CONFIG.name} — Apps, die schnell live gehen`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  metadataBase: new URL(SITE_CONFIG.url),
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — Apps, die schnell live gehen`,
    description: SITE_CONFIG.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_CONFIG.name} — Apps, die schnell live gehen`,
    description: SITE_CONFIG.description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  description: SITE_CONFIG.description,
  founder: {
    "@type": "Person",
    name: SITE_CONFIG.founder,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Frankenthal",
    postalCode: "67227",
    addressCountry: "DE",
  },
  areaServed: { "@type": "Country", name: "DE" },
  serviceType: ["Web-Entwicklung", "Mobile-App-Entwicklung", "MVP-Entwicklung"],
  knowsAbout: ["Next.js", "React", "TypeScript", "Kubernetes", "PostgreSQL"],
  email: SITE_CONFIG.contactEmail,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className={`${spaceGrotesk.className} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
