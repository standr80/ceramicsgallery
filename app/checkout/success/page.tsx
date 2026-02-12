import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div className="py-16 px-4">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-2xl font-semibold text-clay-900">
          Thank you for your purchase
        </h1>
        <p className="mt-4 text-stone-600">
          Your payment was successful. The maker will be in touch about delivery.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-clay-600 px-6 py-3 text-base font-medium text-white hover:bg-clay-700"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
