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
  description: "Play Rock Scissors Paper onchain on Base!",
  openGraph: {
    title: "Rock Scissors Paper - Onchain",
    description: "Play Rock Scissors Paper onchain on Base!",
    images: ["https://janken-miniapp.vercel.app/api/og"],
  },
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://janken-miniapp.vercel.app/api/og",
      button: {
        title: "Play Now",
        action: {
          type: "launch_frame",
          name: "Rock Scissors Paper",
          url: "https://janken-miniapp.vercel.app",
          splashImageUrl: "https://janken-miniapp.vercel.app/api/og",
          splashBackgroundColor: "#0a0a0a",
        },
      },
    }),
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
