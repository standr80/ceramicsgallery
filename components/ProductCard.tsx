import Image from "next/image";
import Link from "next/link";
import type { Product, Potter } from "@/types";

interface ProductCardProps {
  product: Product;
  potter?: Potter;
  showPotter?: boolean;
}

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(price);
}

export function ProductCard({ product, potter, showPotter = false }: ProductCardProps) {
  const potterHref = potter ? `/${potter.slug}` : "#";
  const productHref = potter ? `/${potter.slug}/${product.slug}` : "#";

  return (
    <article className="group rounded-xl overflow-hidden bg-white border border-clay-200/60 shadow-sm hover:shadow-md transition-shadow">
      <Link href={productHref} className="block aspect-square relative bg-stone-100 overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
        />
      </Link>
      <div className="p-4">
        {showPotter && potter && (
          <Link
            href={potterHref}
            className="text-sm text-clay-600 hover:text-clay-700 font-medium"
          >
            {potter.name}
          </Link>
        )}
        <h3 className="font-display text-lg font-semibold text-stone-900 mt-0.5">
          <Link href={productHref} className="hover:text-clay-600 transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="text-stone-600 text-sm line-clamp-2 mt-1">{product.description}</p>
        <p className="mt-2 font-semibold text-clay-700">{formatPrice(product.price, product.currency)}</p>
        <Link
          href={productHref}
          className="mt-3 inline-block rounded-lg bg-clay-600 px-4 py-2 text-sm font-medium text-white hover:bg-clay-700 focus:outline-none focus:ring-2 focus:ring-clay-500 focus:ring-offset-2"
        >
          View product
        </Link>
      </div>
    </article>
  );
}
