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
        initialWebsite={potter.website ?? null}
        initialWebsiteAbout={potter.website_about ?? null}
        initialWebsiteShop={potter.website_shop ?? null}
        initialWebsiteCourses={potter.website_courses ?? null}
        initialImage={potter.image ?? null}
        potterId={potter.id}
      />
    </div>
  );
}
