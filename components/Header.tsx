import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-clay-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/"
            className="font-display text-2xl font-semibold text-clay-800 hover:text-clay-600 transition-colors"
          >
            Ceramics Gallery
          </Link>
          <nav className="flex items-center gap-6" aria-label="Main navigation">
            <Link
              href="/"
              className="text-stone-600 hover:text-clay-600 font-medium transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#potters"
              className="text-stone-600 hover:text-clay-600 font-medium transition-colors"
            >
              Potters
            </Link>
            <Link
              href="/courses"
              className="text-stone-600 hover:text-clay-600 font-medium transition-colors"
            >
              Courses
            </Link>
            <Link
              href="/signup"
              className="btn-primary text-sm"
            >
              Join as a Potter
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
