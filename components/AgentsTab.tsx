"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateUrls, type UrlFields } from "@/app/actions/potter";
import { DraftProductCard } from "@/components/DraftProductCard";
import { DraftCourseCard } from "@/components/DraftCourseCard";

interface DraftProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image: string | null;
  category: string | null;
}

interface DraftCourse {
  id: string;
  title: string;
  description: string;
  type: string | null;
  price: number;
  currency: string;
  duration: string | null;
  skill_level: string | null;
  location: string | null;
  start_date: string | null;
}

interface AgentsTabProps {
  savedUrls: UrlFields;
  productDrafts: DraftProduct[];
  courseDrafts: DraftCourse[];
}

type ScoutId =
  | "profile_main"
  | "profile_about"
  | "shop_1"
  | "shop_2"
  | "shop_3"
  | "courses_1"
  | "courses_2"
  | "courses_3";

interface ScoutResult {
  success: boolean;
  message: string;
}

const EMPTY_URLS: UrlFields = {
  website: "",
  website_about: "",
  website_shop: "",
  website_shop_2: "",
  website_shop_3: "",
  website_courses: "",
  website_courses_2: "",
  website_courses_3: "",
};

export function AgentsTab({ savedUrls: initialSaved, productDrafts, courseDrafts }: AgentsTabProps) {
  const router = useRouter();

  const [saved, setSaved] = useState<UrlFields>({ ...EMPTY_URLS, ...initialSaved });
  const [draft, setDraft] = useState<UrlFields>({ ...EMPTY_URLS, ...initialSaved });
  const [shopCount, setShopCount] = useState(() =>
    initialSaved.website_shop_3 ? 3 : initialSaved.website_shop_2 ? 2 : 1
  );
  const [coursesCount, setCoursesCount] = useState(() =>
    initialSaved.website_courses_3 ? 3 : initialSaved.website_courses_2 ? 2 : 1
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveDone, setSaveDone] = useState(false);

  const [runningScout, setRunningScout] = useState<ScoutId | null>(null);
  const [scoutResults, setScoutResults] = useState<Partial<Record<ScoutId, ScoutResult>>>({});

  const isDirty =
    (Object.keys(draft) as (keyof UrlFields)[]).some((k) => draft[k] !== saved[k]);

  function setUrl(key: keyof UrlFields, value: string) {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaveDone(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveDone(false);
    const result = await updateUrls(draft);
    setSaving(false);
    if (result && "error" in result) {
      setSaveError(result.error ?? "Save failed");
    } else {
      setSaved({ ...draft });
      setSaveDone(true);
    }
  }

  const runScout = useCallback(
    async (scoutId: ScoutId, scoutType: "profile" | "shop" | "courses", url: string) => {
      if (runningScout) return;
      setRunningScout(scoutId);
      setScoutResults((r) => {
        const next = { ...r };
        delete next[scoutId];
        return next;
      });

      try {
        const res = await fetch("/api/agents/run-scout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scoutType, url }),
        });
        const json = await res.json();

        if (!res.ok || json.error) {
          setScoutResults((r) => ({
            ...r,
            [scoutId]: { success: false, message: json.error ?? "Scout failed" },
          }));
        } else {
          let message = "Scout complete.";
          if (scoutType === "profile") {
            message = "Biography updated successfully.";
          } else if (typeof json.inserted === "number") {
            message =
              json.inserted === 0
                ? "Scout complete — no new items found."
                : `Scout complete — ${json.inserted} draft${json.inserted === 1 ? "" : "s"} created.`;
          }
          setScoutResults((r) => ({ ...r, [scoutId]: { success: true, message } }));
          router.refresh();
        }
      } catch {
        setScoutResults((r) => ({
          ...r,
          [scoutId]: { success: false, message: "Network error — please try again." },
        }));
      } finally {
        setRunningScout(null);
      }
    },
    [runningScout, router]
  );

  const ScoutButton = ({
    scoutId,
    scoutType,
    url,
  }: {
    scoutId: ScoutId;
    scoutType: "profile" | "shop" | "courses";
    url: string;
  }) => {
    if (!url) return null;
    const isRunning = runningScout === scoutId;
    const isBlocked = runningScout !== null && runningScout !== scoutId;
    const result = scoutResults[scoutId];

    return (
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          type="button"
          onClick={() => runScout(scoutId, scoutType, url)}
          disabled={isRunning || isBlocked || isDirty}
          className={`text-xs px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
            isRunning
              ? "bg-amber-100 text-amber-700 cursor-wait"
              : isBlocked || isDirty
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-clay-600 text-white hover:bg-clay-700"
          }`}
          title={isDirty ? "Save your URLs first before running a scout" : undefined}
        >
          {isRunning ? "Running…" : "Run Scout"}
        </button>
        {result && (
          <p className={`text-xs ${result.success ? "text-green-700" : "text-red-600"}`}>
            {result.message}
          </p>
        )}
      </div>
    );
  };

  const hasAboutUrl = !!saved.website_about;
  const totalDrafts = productDrafts.length + courseDrafts.length;

  return (
    <div className="space-y-10">
      {/* ── URL Manager ─────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-clay-900">Scout URLs</h2>
          <p className="mt-1 text-sm text-stone-500">
            Add the URLs you want the AI Scout to read, then save and run each scout individually.
            Only one scout can run at a time.
          </p>
        </div>

        {saveError && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</p>
        )}

        <div className="rounded-lg border border-stone-200 bg-white divide-y divide-stone-100">
          {/* Profile section */}
          <div className="p-4 space-y-3">
            <p className="text-sm font-semibold text-stone-700">Profile / Biography</p>

            {/* Main website — only show scout button if no about URL saved */}
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-medium text-stone-500">Main website</label>
                <input
                  type="url"
                  value={draft.website}
                  onChange={(e) => setUrl("website", e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              {!hasAboutUrl && saved.website && (
                <div className="mt-6">
                  <ScoutButton scoutId="profile_main" scoutType="profile" url={saved.website} />
                </div>
              )}
            </div>

            {/* About / bio page */}
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-1">
                <label className="block text-xs font-medium text-stone-500">
                  About / bio page{" "}
                  <span className="text-stone-400 font-normal">
                    — if set, this is used for your profile scout instead of the main website
                  </span>
                </label>
                <input
                  type="url"
                  value={draft.website_about}
                  onChange={(e) => setUrl("website_about", e.target.value)}
                  className="input-field text-sm"
                  placeholder="https://yourwebsite.com/about"
                />
              </div>
              {saved.website_about && (
                <div className="mt-6">
                  <ScoutButton scoutId="profile_about" scoutType="profile" url={saved.website_about} />
                </div>
              )}
            </div>
          </div>

          {/* Shop section */}
          <div className="p-4 space-y-3">
            <p className="text-sm font-semibold text-stone-700">Shop / Products</p>
            {(["website_shop", "website_shop_2", "website_shop_3"] as const)
              .slice(0, shopCount)
              .map((key, i) => {
                const scoutId = (["shop_1", "shop_2", "shop_3"] as ScoutId[])[i];
                return (
                  <div key={key} className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs font-medium text-stone-500">
                        Shop URL {shopCount > 1 ? i + 1 : ""}
                      </label>
                      <input
                        type="url"
                        value={draft[key]}
                        onChange={(e) => setUrl(key, e.target.value)}
                        className="input-field text-sm"
                        placeholder="https://yourwebsite.com/shop"
                      />
                    </div>
                    {saved[key] && (
                      <div className="mt-6">
                        <ScoutButton scoutId={scoutId} scoutType="shop" url={saved[key]} />
                      </div>
                    )}
                  </div>
                );
              })}
            {shopCount < 3 && (
              <button
                type="button"
                onClick={() => setShopCount((n) => Math.min(n + 1, 3))}
                className="text-xs text-clay-600 hover:text-clay-800 font-medium"
              >
                + Add another shop URL
              </button>
            )}
          </div>

          {/* Courses section */}
          <div className="p-4 space-y-3">
            <p className="text-sm font-semibold text-stone-700">Courses / Workshops</p>
            {(["website_courses", "website_courses_2", "website_courses_3"] as const)
              .slice(0, coursesCount)
              .map((key, i) => {
                const scoutId = (["courses_1", "courses_2", "courses_3"] as ScoutId[])[i];
                return (
                  <div key={key} className="flex items-start gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="block text-xs font-medium text-stone-500">
                        Courses URL {coursesCount > 1 ? i + 1 : ""}
                      </label>
                      <input
                        type="url"
                        value={draft[key]}
                        onChange={(e) => setUrl(key, e.target.value)}
                        className="input-field text-sm"
                        placeholder="https://yourwebsite.com/courses"
                      />
                    </div>
                    {saved[key] && (
                      <div className="mt-6">
                        <ScoutButton scoutId={scoutId} scoutType="courses" url={saved[key]} />
                      </div>
                    )}
                  </div>
                );
              })}
            {coursesCount < 3 && (
              <button
                type="button"
                onClick={() => setCoursesCount((n) => Math.min(n + 1, 3))}
                className="text-xs text-clay-600 hover:text-clay-800 font-medium"
              >
                + Add another courses URL
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save URLs"}
          </button>
          {saveDone && !isDirty && (
            <p className="text-sm text-green-700">URLs saved.</p>
          )}
          {isDirty && (
            <p className="text-xs text-amber-600">
              Unsaved changes — save before running a scout.
            </p>
          )}
        </div>
      </section>

      {/* ── Draft Review ────────────────────────────────── */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold text-clay-900">Scout Drafts</h2>
          <p className="mt-1 text-sm text-stone-500">
            Items imported by the scout. Review each one — publish, edit, or discard.
          </p>
        </div>

        {totalDrafts === 0 ? (
          <div className="rounded-lg border border-dashed border-stone-200 py-16 text-center text-stone-400">
            <p className="text-sm font-medium">No drafts yet.</p>
            <p className="text-xs mt-1">Run a scout above to import products or courses.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {productDrafts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-stone-600 mb-3">
                  Products ({productDrafts.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productDrafts.map((p) => (
                    <DraftProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
            {courseDrafts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-stone-600 mb-3">
                  Courses ({courseDrafts.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {courseDrafts.map((c) => (
                    <DraftCourseCard key={c.id} course={c} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
