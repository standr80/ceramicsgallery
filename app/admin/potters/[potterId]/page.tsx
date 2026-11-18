import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { setPotterPublished, setPotterDemo, setPieceStatus, signInAsPotter } from "@/app/actions/admin";
import { ConfirmButton } from "@/components/admin/ConfirmButton";

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
const fmtPrice = (p: number | null) => (p == null ? "—" : `£${(p / 100).toFixed(2)}`);

export default async function AdminPotterPage({ params }: { params: Promise<{ potterId: string }> }) {
  const { potterId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(potterId)) notFound();
  const admin = createAdminClient();

  const { data: potter } = await admin.from("potters").select("*").eq("id", potterId).single();
  if (!potter) notFound();

  const [{ data: authUser }, { data: pieces }, { data: enquiries }] = await Promise.all([
    admin.auth.admin.getUserById(potter.user_id),
    admin.from("pieces").select("id, title, status, price_pence, created_at")
      .eq("potter_id", potterId).order("created_at", { ascending: false }),
    admin.from("contact_enquiries").select("id, sender_name, sender_email, message, created_at")
      .eq("potter_id", potterId).order("created_at", { ascending: false }).limit(50),
  ]);
  const user = authUser?.user;

  const details: [string, React.ReactNode][] = [
    ["Sign-in email", user?.email ?? "—"],
    ["Contact email", potter.contact_email ?? "(uses sign-in email)"],
    ["Joined", fmtDate(potter.created_at)],
    ["Last sign-in", fmtDate(user?.last_sign_in_at)],
    ["Email confirmed", user?.email_confirmed_at ? "Yes" : "No"],
    ["Onboarding step", potter.onboarding_step],
    ["Plan", `${potter.plan} · ${(potter.commission_bps / 100).toFixed(1)}% commission`],
    ["Location", potter.location_label ?? "—"],
    ["Studio address", potter.studio_address ?? "—"],
  ];
  const stripe: [string, React.ReactNode][] = [
    ["Account", potter.stripe_account_id ?? "Not connected"],
    ["Charges enabled", potter.stripe_charges_ok ? "Yes" : "No"],
    ["Payouts enabled", potter.stripe_payouts_ok ? "Yes" : "No"],
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/admin" className="text-sm text-stone-500 hover:text-clay-700">← All potters</Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-2">
          <div>
            <h1 className="font-display text-3xl font-semibold text-clay-900">{potter.studio_name ?? potter.display_name}</h1>
            <p className="text-stone-500 text-sm mt-1">
              {potter.display_name} · <Link href={`/${potter.slug}`} className="hover:underline">/{potter.slug}</Link> ·{" "}
              <span className={potter.is_published ? "text-green-700" : "text-stone-600"}>
                {potter.is_published ? "Published" : "Hidden"}
              </span>
              {potter.is_demo && <> · <span className="text-celadon-dark">Demo</span></>}
            </p>
          </div>
          <div className="flex gap-2">
            <form action={setPotterPublished.bind(null, potter.id, !potter.is_published)}>
              <button className="btn-ghost text-sm">{potter.is_published ? "Unpublish" : "Publish"}</button>
            </form>
            <form action={setPotterDemo.bind(null, potter.id, !potter.is_demo)}>
              <button className="btn-ghost text-sm" title={potter.is_demo
                ? "Show this potter as real: enquiry and booking forms appear, and messages go to their account email"
                : "Mark as demo: forms are replaced by a demo notice"}>
                {potter.is_demo ? "Turn demo off" : "Make demo"}
              </button>
            </form>
            <form action={signInAsPotter.bind(null, potter.id)}>
              <ConfirmButton
                className="btn-primary text-sm px-4 py-2"
                message={`Sign in as ${potter.display_name}? You'll be signed out of admin and see their dashboard. Anything you change is real. Sign out and back in as yourself when you're done.`}
              >
                Sign in as potter
              </ConfirmButton>
            </form>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <DetailCard title="Account" rows={details} />
        <DetailCard title="Stripe" rows={stripe} />
      </div>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Pieces ({pieces?.length ?? 0})</h2>
        {!pieces?.length ? (
          <p className="text-sm text-stone-500">No pieces yet.</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-stone-500 border-b">
                <tr><th className="p-3">Piece</th><th className="p-3">Price</th><th className="p-3">Added</th><th className="p-3">Status</th></tr>
              </thead>
              <tbody>
                {pieces.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="p-3">
                      <Link href={`/${potter.slug}/${p.id}`} className="font-medium text-clay-700 hover:underline">{p.title}</Link>
                    </td>
                    <td className="p-3 tabular-nums">{fmtPrice(p.price_pence)}</td>
                    <td className="p-3 text-stone-500 whitespace-nowrap">{fmtDate(p.created_at)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={p.status === "live" ? "text-green-700" : "text-stone-500"}>{p.status}</span>
                        {p.status === "live" && (
                          <form action={setPieceStatus.bind(null, p.id, "archived")}>
                            <button className="text-xs underline text-stone-500 hover:text-red-700">Take down</button>
                          </form>
                        )}
                        {p.status === "archived" && (
                          <form action={setPieceStatus.bind(null, p.id, "live")}>
                            <button className="text-xs underline text-stone-500 hover:text-clay-700">Restore</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold mb-3">Enquiries ({enquiries?.length ?? 0})</h2>
        {!enquiries?.length ? (
          <p className="text-sm text-stone-500">No enquiries yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {enquiries.map((e) => (
              <li key={e.id} className="card p-4 text-sm">
                <p className="text-stone-500">
                  <span className="font-medium text-stone-900">{e.sender_name}</span> &lt;{e.sender_email}&gt; · {fmtDate(e.created_at)}
                </p>
                <p className="mt-2 whitespace-pre-line text-stone-700">{e.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DetailCard({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <div className="card p-5">
      <h2 className="font-semibold text-stone-900 mb-3">{title}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-stone-500">{k}</dt>
            <dd className="text-stone-900 break-all">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
