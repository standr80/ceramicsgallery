import { createClient } from "@/lib/supabase/server";
import { getCurrentPotter } from "@/lib/get-potter";
import { EditProfileForm } from "@/components/EditProfileForm";

export default async function ProfilePage() {
  const potter = await getCurrentPotter();
  if (!potter) return null;

  // Fetch the auth email separately — not stored in the potters table
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-6">
        Edit profile
      </h2>
      <EditProfileForm
        initialName={potter.name}
        initialBiography={potter.biography}
        initialImage={potter.image ?? null}
        initialSlug={potter.slug}
        initialEmail={user?.email ?? ""}
        potterId={potter.id}
      />
    </div>
  );
}
