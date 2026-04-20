import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AgentsTab } from "@/components/AgentsTab";
import type { UrlFields } from "@/app/actions/potter";

export const dynamic = "force-dynamic";

export default async function AgentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: potter } = await supabase
    .from("potters")
    .select(
      "id, website, website_about, website_shop, website_shop_2, website_shop_3, website_courses, website_courses_2, website_courses_3"
    )
    .eq("auth_user_id", user.id)
    .single();

  if (!potter) redirect("/dashboard");

  const savedUrls: UrlFields = {
    website: potter.website ?? "",
    website_about: potter.website_about ?? "",
    website_shop: potter.website_shop ?? "",
    website_shop_2: potter.website_shop_2 ?? "",
    website_shop_3: potter.website_shop_3 ?? "",
    website_courses: potter.website_courses ?? "",
    website_courses_2: potter.website_courses_2 ?? "",
    website_courses_3: potter.website_courses_3 ?? "",
  };

  const [{ data: productDrafts }, { data: courseDrafts }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, price, currency, image, category")
      .eq("potter_id", potter.id)
      .eq("active", false)
      .eq("source", "onboarding-scout")
      .order("created_at", { ascending: false }),
    supabase
      .from("courses")
      .select("id, title, description, type, price, currency, duration, skill_level, location, start_date")
      .eq("potter_id", potter.id)
      .eq("active", false)
      .eq("source", "onboarding-scout")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AgentsTab
      savedUrls={savedUrls}
      productDrafts={productDrafts ?? []}
      courseDrafts={courseDrafts ?? []}
    />
  );
}
