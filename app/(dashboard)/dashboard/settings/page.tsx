import { getCurrentPotter } from "@/lib/get-potter";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const potter = await getCurrentPotter();
  if (!potter) redirect("/login");

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-semibold text-clay-900 mb-8">Settings</h1>

      <div className="card p-5 flex flex-col gap-1">
        <p className="text-sm font-medium text-stone-700">Your gallery URL</p>
        <p className="text-clay-700 font-mono text-sm">ceramicsgallery.co.uk/{potter.slug}</p>
      </div>

      <div className="card p-5 mt-4 flex flex-col gap-1">
        <p className="text-sm font-medium text-stone-700">Plan</p>
        <p className="capitalize text-stone-600">{potter.plan}</p>
      </div>
    </div>
  );
}
