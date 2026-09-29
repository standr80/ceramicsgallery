import { getCurrentPotter } from "@/lib/get-potter";
import { updateProfile, publishProfile } from "@/app/actions/potter";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const potter = await getCurrentPotter();
  if (!potter) redirect("/login");

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateProfile(formData);
  }

  async function handlePublish() {
    "use server";
    await publishProfile();
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-semibold text-clay-900">Profile</h1>
        {!potter.is_published && (
          <form action={handlePublish}>
            <button className="btn-primary">Publish profile</button>
          </form>
        )}
        {potter.is_published && (
          <span className="text-sm font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">Published</span>
        )}
      </div>

      <form action={handleUpdate} className="flex flex-col gap-5">
        <div>
          <label htmlFor="display_name" className="block text-sm font-medium mb-1.5">Your name</label>
          <input id="display_name" name="display_name" type="text" required defaultValue={potter.display_name} className="input-field" />
        </div>
        <div>
          <label htmlFor="studio_name" className="block text-sm font-medium mb-1.5">Studio name <span className="text-stone-400 font-normal">(optional)</span></label>
          <input id="studio_name" name="studio_name" type="text" defaultValue={potter.studio_name ?? ""} className="input-field" />
        </div>
        <div>
          <label htmlFor="headline" className="block text-sm font-medium mb-1.5">Headline <span className="text-stone-400 font-normal">(one line, shown under your name)</span></label>
          <input id="headline" name="headline" type="text" defaultValue={potter.headline ?? ""} className="input-field" placeholder="e.g. Wheel-thrown stoneware from rural Suffolk" />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1.5">Bio</label>
          <textarea id="bio" name="bio" rows={5} defaultValue={potter.bio ?? ""} className="input-field resize-y" placeholder="Tell buyers about your practice, influences and the kind of work you make…" />
        </div>
        <div>
          <label htmlFor="location_label" className="block text-sm font-medium mb-1.5">Location</label>
          <input id="location_label" name="location_label" type="text" defaultValue={potter.location_label ?? ""} className="input-field" placeholder="e.g. Bury St Edmunds, Suffolk" />
        </div>
        <div>
          <label htmlFor="instagram" className="block text-sm font-medium mb-1.5">Instagram handle <span className="text-stone-400 font-normal">(optional)</span></label>
          <input id="instagram" name="instagram" type="text" defaultValue={potter.instagram ?? ""} className="input-field" placeholder="@yourhandle" />
        </div>
        <div>
          <label htmlFor="website_url" className="block text-sm font-medium mb-1.5">Website <span className="text-stone-400 font-normal">(optional)</span></label>
          <input id="website_url" name="website_url" type="url" defaultValue={potter.website_url ?? ""} className="input-field" placeholder="https://yourwebsite.co.uk" />
        </div>
        <div className="pt-2">
          <button type="submit" className="btn-primary">Save profile</button>
        </div>
      </form>
    </div>
  );
}
