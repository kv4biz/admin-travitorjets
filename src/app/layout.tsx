import type { Metadata } from "next";
import { Geist, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { content } from "@/lib/content";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const fontMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: content.layout.title,
  description: content.layout.description,
  icons: {
    icon: content.layout.favicon,
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
