import { getCurrentPotter } from "@/lib/get-potter";
import { EditProfileForm } from "@/components/EditProfileForm";

export default async function ProfilePage() {
  const potter = await getCurrentPotter();
  if (!potter) return null;

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-6">
        Edit profile
      </h2>
      <EditProfileForm
        initialName={potter.name}
        initialBiography={potter.biography}
        initialWebsite={potter.website}
        initialImage={potter.image}
        potterId={potter.id}
      />
    </div>
  );
}
