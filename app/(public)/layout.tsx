import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:text-paper focus:px-5 focus:py-2.5 focus:text-sm">
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      <Footer />
    </div>
  );
}
