import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ContactForm } from "@/components/ContactForm";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ course?: string; courseId?: string }>;
}

export default async function ContactPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { course: courseTitle, courseId } = await searchParams;

  const admin = createAdminClient();
  const { data: potter } = await admin
    .from("potters")
    .select("id, name, slug")
    .eq("slug", slug)
    .eq("active", true)
    .single();

  if (!potter) notFound();

  return (
    <div className="py-14 px-4">
      <div className="mx-auto max-w-xl">
        <p className="text-sm text-clay-600 font-medium mb-1">
          {potter.name}
        </p>
        <h1 className="font-display text-3xl font-semibold text-clay-900">
          {courseTitle ? `Enquire about: ${courseTitle}` : "Get in touch"}
        </h1>
        <p className="mt-2 text-stone-600">
          Send {potter.name} a message and they'll get back to you directly.
        </p>
        <ContactForm
          potterId={potter.id}
          potterName={potter.name}
          potterSlug={potter.slug}
          courseId={courseId ?? null}
          courseTitle={courseTitle ?? null}
        />
      </div>
    </div>
  );
}
