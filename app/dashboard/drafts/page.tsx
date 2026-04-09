import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DraftProductCard } from "@/components/DraftProductCard";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: potter } = await supabase
    .from("potters")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) redirect("/dashboard");

  const { data: drafts } = await supabase
    .from("products")
    .select("id, name, description, price, currency, image, category")
    .eq("potter_id", potter.id)
    .eq("active", false)
    .eq("source", "onboarding-scout")
    .order("created_at", { ascending: false });

  const draftList = drafts ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Draft Listings</h1>
        <p className="text-stone-500 mt-1 text-sm">
          These products were automatically imported from your website. Review each one — you can
          publish it straight away, edit the details first, or discard it.
        </p>
      </div>

      {draftList.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-lg font-medium">No drafts pending review.</p>
          <p className="text-sm mt-1">
            When the Onboarding Scout imports products from your website they will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {draftList.map((product) => (
            <DraftProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
