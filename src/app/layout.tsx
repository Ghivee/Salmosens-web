import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SALMOSENS - Deteksi Salmonella Cepat & Akurat",
  description:
    "Platform ketahanan pangan berbasis IoT untuk deteksi Salmonella dalam 15 menit. Dilindungi Kementerian Kesehatan dan Kementerian Pertanian.",
  keywords: [
    "SALMOSENS",
    "Salmonella",
    "ketahanan pangan",
    "food safety",
    "deteksi bakteri",
    "IoT",
    "Indonesia",
  ],
  authors: [{ name: "SALMOSENS Team" }],
  openGraph: {
    title: "SALMOSENS - Deteksi Salmonella Cepat & Akurat",
    description:
      "Platform ketahanan pangan berbasis IoT untuk deteksi Salmonella dalam 15 menit.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}