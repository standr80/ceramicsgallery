import { createAdminClient } from "@/lib/supabase/admin";
import { PotterLoginRow } from "@/components/PotterLoginRow";

export const dynamic = "force-dynamic";

export default async function PotterLoginsPage() {
  const admin = createAdminClient();
  const { data: potters } = await admin
    .from("potters")
    .select("id, name, auth_user_id, force_password_reset")
    .order("name");

  const pottersWithEmail = await Promise.all(
    (potters ?? []).map(async (p) => {
      const { data: authUser } = await admin.auth.admin.getUserById(p.auth_user_id);
      return {
        ...p,
        email: authUser?.user?.email ?? "(email not found)",
      };
    })
  );

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-clay-900 mb-4">
        Potter logins
      </h2>
      <p className="text-stone-600 mb-6">
        View login emails, reset passwords, and force password reset on next login.
      </p>
      {!pottersWithEmail.length ? (
        <p className="text-stone-600">No potters yet.</p>
      ) : (
        <div className="rounded-lg border border-clay-200/60 overflow-hidden">
          <table className="min-w-full divide-y divide-clay-200/60">
            <thead className="bg-stone-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Potter
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Login email
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Reset password
                </th>
                <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-stone-700">
                  Force password reset
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-clay-200/60 bg-white">
              {pottersWithEmail.map((p) => (
                <PotterLoginRow
                  key={p.id}
                  potterId={p.id}
                  potterName={p.name}
                  email={p.email}
                  forcePasswordReset={p.force_password_reset ?? false}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
