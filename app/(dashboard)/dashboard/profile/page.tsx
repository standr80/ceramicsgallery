import { getCurrentPotter } from "@/lib/get-potter";
import { updateProfile, publishProfile } from "@/app/actions/potter";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AvatarUpload } from "@/components/potter/AvatarUpload";

export const dynamic = "force-dynamic";

interface Props { searchParams: Promise<{ saved?: string }> }

export default async function ProfilePage({ searchParams }: Props) {
  const [potter, { saved }] = await Promise.all([getCurrentPotter(), searchParams]);
  if (!potter) redirect("/login");
  const { data: { user } } = await (await createClient()).auth.getUser();
  const accountEmail = user?.email;

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

      {saved && (
        <div className="mb-6 flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          Profile saved.
        </div>
      )}

      <form action={handleUpdate} className="flex flex-col gap-5">
        <div>
          <p className="block text-sm font-medium mb-2">Photo</p>
          <AvatarUpload initialPath={potter.avatar_path} />
        </div>
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
          <label htmlFor="studio_address" className="block text-sm font-medium mb-1.5">Studio address <span className="text-stone-400 font-normal">(optional, shown on your page)</span></label>
          <textarea id="studio_address" name="studio_address" rows={3} defaultValue={potter.studio_address ?? ""} className="input-field resize-y" placeholder={"The Old Barn\nMill Lane\nBury St Edmunds IP28 6AB"} />
        </div>
        <div>
          <label htmlFor="opening_hours" className="block text-sm font-medium mb-1.5">Opening hours <span className="text-stone-400 font-normal">(optional)</span></label>
          <textarea id="opening_hours" name="opening_hours" rows={3} defaultValue={potter.opening_hours ?? ""} className="input-field resize-y" placeholder={"Sat–Sun 10am–4pm\nWeekdays by appointment"} />
        </div>
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium mb-1.5">Contact email <span className="text-stone-400 font-normal">(private — buyer messages are sent here)</span></label>
          <input id="contact_email" name="contact_email" type="email" defaultValue={potter.contact_email ?? accountEmail ?? ""} className="input-field" placeholder="hello@yourstudio.co.uk" />
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
