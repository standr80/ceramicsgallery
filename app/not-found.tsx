import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-5xl font-semibold text-clay-900 mb-4">404</h1>
      <p className="text-stone-600 mb-8">That page doesn't exist.</p>
      <Link href="/" className="btn-primary">Back to gallery</Link>
    </div>
  );
}
