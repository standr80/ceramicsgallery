import type { Metadata } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ceramics Gallery | Handmade Pottery by UK Potters",
  description:
    "Discover unique ceramics from British potters. Browse and buy handmade pottery, stoneware, and earthenware.",
  metadataBase: new URL("https://www.ceramicsgallery.co.uk"),
  openGraph: {
    title: "Ceramics Gallery | Handmade Pottery by UK Potters",
    description:
      "Discover unique ceramics from British potters. Browse and buy handmade pottery.",
    url: "https://www.ceramicsgallery.co.uk",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
