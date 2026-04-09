import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DraftProductCard } from "@/components/DraftProductCard";
import { DraftCourseCard } from "@/components/DraftCourseCard";

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

  const products = productDrafts ?? [];
  const courses = courseDrafts ?? [];
  const totalDrafts = products.length + courses.length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Draft Listings</h1>
        <p className="text-stone-500 mt-1 text-sm">
          These were automatically imported from your website by the AI scout. Review each one
          — publish, edit the details, or discard it.
        </p>
      </div>

      {totalDrafts === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-lg font-medium">No drafts pending review.</p>
          <p className="text-sm mt-1">
            When the scout imports content from your website it will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Product drafts */}
          {products.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-stone-700 mb-4">
                Products ({products.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <DraftProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}

          {/* Course drafts */}
          {courses.length > 0 && (
            <section>
              <h2 className="text-base font-semibold text-stone-700 mb-4">
                Courses ({courses.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {courses.map((course) => (
                  <DraftCourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
