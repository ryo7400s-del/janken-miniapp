import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rock Scissors Paper - Onchain",
  description: "Onchain Rock Scissors Paper Game on Base",
  openGraph: {
    title: "Rock Scissors Paper - Onchain",
    description: "Play Rock Scissors Paper onchain on Base!",
    images: ["https://janken-miniapp.vercel.app/og.png"],
  },
  other: {
    "fc:frame": "next",
    "fc:frame:image": "https://janken-miniapp.vercel.app/og.png",
    "fc:frame:button:1": "Play Now",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://janken-miniapp.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <meta name="base:app_id" content="6a0284d00ec9a0da33575245" />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
