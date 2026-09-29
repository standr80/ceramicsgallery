import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-display",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ceramics Gallery | Handmade Pottery by UK Potters",
  description:
    "Discover and buy unique handmade ceramics directly from British potters.",
  metadataBase: new URL("https://www.ceramicsgallery.co.uk"),
  openGraph: {
    title: "Ceramics Gallery | Handmade Pottery by UK Potters",
    description: "Discover and buy unique handmade ceramics directly from British potters.",
    url: "https://www.ceramicsgallery.co.uk",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
