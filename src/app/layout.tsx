// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { content } from "@/lib/content";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

/* ---------------- SITE CONFIG ---------------- */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://traviatorjets.com";
const siteName = "TraviatorJets";
const title = content.layout.title;
const description = content.layout.description;

/* ---------------- METADATA ---------------- */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  keywords: ["private jet charter", "empty legs", "luxury aviation", "business aviation", "air charter", "private flights", "TraviatorJets"],
  authors: [
    {
      name: siteName,
    },
  ],
  creator: siteName,
  publisher: siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: siteUrl,
  },

  icons: {
    icon: content.layout.favicon,
    shortcut: content.layout.favicon,
    apple: content.layout.favicon,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName,
    title,
    description,
    images: [
      {
        url: content.layout.ogImage,
        width: 1200,
        height: 630,
        alt: "TraviatorJets Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [content.layout.ogImage],
  },
};

/* ---------------- ROOT LAYOUT ---------------- */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${serif.variable} ${mono.variable} antialiased min-h-screen bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
