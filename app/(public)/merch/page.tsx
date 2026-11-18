export const metadata = {
  title: "Merch | Ceramics Gallery",
  description: "Ceramics Gallery merchandise.",
  alternates: { canonical: "/merch" },
  // Placeholder until the content is ready: keep it out of search results.
  robots: { index: false },
};

export default function MerchPage() {
  return (
    <div className="py-14 sm:py-20 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="border-b border-ink/15 pb-8">
          <p className="kicker">Merch</p>
          <h1 className="font-display text-6xl sm:text-7xl text-ink leading-none mt-3">Merch</h1>
        </div>
        <p className="text-ink/65 mt-10 text-lg">Coming soon.</p>
      </div>
    </div>
  );
}
