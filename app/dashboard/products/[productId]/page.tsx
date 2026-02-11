import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";
import { EditProductForm } from "@/components/EditProductForm";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { productId } = await params;
  const potter = await getCurrentPotter();
  if (!potter) return null;

  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("potter_id", potter.id)
    .single();

  if (!product) notFound();

  const images = product.images?.length ? product.images : [product.image];

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-clay-600 hover:text-clay-700 mb-4 inline-block">
        ← Back to dashboard
      </Link>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-6">
        Edit product
      </h2>
      <EditProductForm
        productId={product.id}
        initialName={product.name}
        initialDescription={product.description}
        initialDescriptionExtended={product.description_extended}
        initialPrice={Number(product.price)}
        initialCategory={product.category}
        initialFeatured={product.featured}
        initialSku={product.sku}
        initialImages={images}
      />
    </div>
  );
}
