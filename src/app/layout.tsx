import type { Metadata } from "next";
import { Geist, Geist_Mono, Oswald } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "StadiumHop — Find hotels on the right transit line",
  description:
    "Find affordable hotels along public transit routes to major event venues. Save money by staying further away — on a direct train line.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6966038067085167"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oswald.variable} font-sans antialiased bg-white text-zinc-900 min-h-screen`}
      >
        <Header />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  );
}
