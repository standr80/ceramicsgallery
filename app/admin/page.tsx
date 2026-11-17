import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { setPotterPublished, setPieceStatus, deleteOrphanAccount } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

type Potter = {
  id: string; user_id: string; slug: string; display_name: string; studio_name: string | null;
  is_published: boolean; stripe_charges_ok: boolean; created_at: string;
};
type Piece = {
  id: string; title: string; status: string; price_pence: number | null; created_at: string;
  potters: { slug: string; display_name: string } | null;
};
type Enquiry = {
  id: string; sender_name: string; sender_email: string; message: string; created_at: string;
  potters: { slug: string; display_name: string } | null;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtPrice = (p: number | null) => (p == null ? "—" : `£${(p / 100).toFixed(2)}`);

export default async function AdminPage() {
  const admin = createAdminClient();
  const [pottersRes, piecesRes, enquiriesRes, usersRes] = await Promise.all([
    admin.from("potters")
      .select("id, user_id, slug, display_name, studio_name, is_published, stripe_charges_ok, created_at")
      .order("created_at", { ascending: false }),
    admin.from("pieces")
      .select("id, title, status, price_pence, created_at, potters(slug, display_name)")
      .order("created_at", { ascending: false }).limit(50),
    admin.from("contact_enquiries")
      .select("id, sender_name, sender_email, message, created_at, potters(slug, display_name)")
      .order("created_at", { ascending: false }).limit(20),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const potters = (pottersRes.data ?? []) as Potter[];
  const pieces = (piecesRes.data ?? []) as unknown as Piece[];
  const enquiries = (enquiriesRes.data ?? []) as unknown as Enquiry[];
  const users = usersRes.data?.users ?? [];
  const emailById = new Map(users.map((u) => [u.id, u.email ?? ""]));

  const potterUserIds = new Set(potters.map((p) => p.user_id));
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());
  const orphans = users.filter((u) => !potterUserIds.has(u.id));

  const { count: pieceCount } = await admin.from("pieces").select("id", { count: "exact", head: true });
  const { count: liveCount } = await admin.from("pieces").select("id", { count: "exact", head: true }).eq("status", "live");
  const { count: enquiryCount } = await admin.from("contact_enquiries").select("id", { count: "exact", head: true });

  const stats = [
    { label: "Accounts", value: users.length },
    { label: "Potters", value: potters.length },
    { label: "Published potters", value: potters.filter((p) => p.is_published).length },
    { label: "Pieces", value: pieceCount ?? 0 },
    { label: "Live pieces", value: liveCount ?? 0 },
    { label: "Enquiries", value: enquiryCount ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-semibold text-clay-900">Admin</h1>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs text-stone-500">{s.label}</p>
            <p className="text-2xl font-semibold text-stone-900 mt-1 tabular-nums">{s.value}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Potters</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500 border-b">
              <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Payments</th><th className="p-3">Joined</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {potters.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/potters/${p.id}`} className="font-medium text-clay-700 hover:underline">{p.studio_name ?? p.display_name}</Link>
                    <span className="block text-xs text-stone-400">/{p.slug}</span>
                  </td>
                  <td className="p-3 text-stone-600">{emailById.get(p.user_id) || "—"}</td>
                  <td className="p-3">{p.stripe_charges_ok ? "Stripe" : "Enquiry only"}</td>
                  <td className="p-3 text-stone-500 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                  <td className="p-3">
                    <form action={setPotterPublished.bind(null, p.id, !p.is_published)} className="flex items-center gap-2">
                      <span className={p.is_published ? "text-green-700" : "text-stone-400"}>{p.is_published ? "Published" : "Hidden"}</span>
                      <button className="text-xs underline text-stone-500 hover:text-clay-700">{p.is_published ? "Unpublish" : "Publish"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-1">Sign-ins without a potter page</h2>
        <p className="text-sm text-stone-500 mb-3">Usually abandoned or failed sign-ups. Deleting removes the sign-in permanently.</p>
        {orphans.length === 0 ? (
          <p className="text-sm text-stone-500">None.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-stone-500 border-b">
                <tr><th className="p-3">Email</th><th className="p-3">Created</th><th className="p-3">Last sign-in</th><th className="p-3"></th></tr>
              </thead>
              <tbody>
                {orphans.map((u) => {
                  const isAdminUser = admins.includes((u.email ?? "").toLowerCase());
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="p-3">{u.email ?? u.id}</td>
                      <td className="p-3 text-stone-500 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                      <td className="p-3 text-stone-500 whitespace-nowrap">{u.last_sign_in_at ? fmtDate(u.last_sign_in_at) : "Never"}</td>
                      <td className="p-3 text-right">
                        {isAdminUser ? (
                          <span className="text-xs text-stone-400">Admin</span>
                        ) : (
                          <form action={deleteOrphanAccount.bind(null, u.id)}>
                            <ConfirmButton
                              className="text-xs underline text-stone-500 hover:text-red-700"
                              message={`Permanently delete the sign-in ${u.email}? This can't be undone.`}
                            >
                              Delete
                            </ConfirmButton>
                          </form>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Recent pieces</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-stone-500 border-b">
              <tr><th className="p-3">Piece</th><th className="p-3">Potter</th><th className="p-3">Price</th><th className="p-3">Added</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {pieces.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3">
                    {p.potters ? (
                      <Link href={`/${p.potters.slug}/${p.id}`} className="font-medium text-clay-700 hover:underline">{p.title}</Link>
                    ) : p.title}
                  </td>
                  <td className="p-3 text-stone-600">{p.potters?.display_name ?? "—"}</td>
                  <td className="p-3 tabular-nums">{fmtPrice(p.price_pence)}</td>
                  <td className="p-3 text-stone-500 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className={p.status === "live" ? "text-green-700" : "text-stone-500"}>{p.status}</span>
                      {p.status === "live" ? (
                        <form action={setPieceStatus.bind(null, p.id, "archived")}>
                          <button className="text-xs underline text-stone-500 hover:text-red-700">Take down</button>
                        </form>
                      ) : p.status === "archived" ? (
                        <form action={setPieceStatus.bind(null, p.id, "live")}>
                          <button className="text-xs underline text-stone-500 hover:text-clay-700">Restore</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Recent enquiries</h2>
        {enquiries.length === 0 ? (
          <p className="text-sm text-stone-500">No enquiries yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {enquiries.map((e) => (
              <li key={e.id} className="card p-4 text-sm">
                <p className="text-stone-500">
                  <span className="font-medium text-stone-900">{e.sender_name}</span> &lt;{e.sender_email}&gt; → {e.potters?.display_name ?? "?"} · {fmtDate(e.created_at)}
                </p>
                <p className="mt-2 whitespace-pre-line text-stone-700 line-clamp-4">{e.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
