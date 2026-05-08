import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { content } from "@/lib/content";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

// Base URL for absolute image paths (important for social sharing)
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://yourdomain.com";

export const metadata: Metadata = {
  title: content.layout.title,
  description: content.layout.description,
  icons: {
    icon: content.layout.favicon,
  },
  // Open Graph for Facebook, LinkedIn, etc.
  openGraph: {
    title: content.layout.title,
    description: content.layout.description,
    url: siteUrl,
    siteName: "TraviatorJets",
    images: [
      {
        url: `${siteUrl}${content.layout.logo}`,
        width: 1200,
        height: 630,
        alt: "TraviatorJets Logo",
      },
    ],
    type: "website",
  },
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: content.layout.title,
    description: content.layout.description,
    images: [`${siteUrl}${content.layout.logo}`],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${fontSerif.variable} ${fontMono.variable} antialiased min-h-full flex flex-col`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
