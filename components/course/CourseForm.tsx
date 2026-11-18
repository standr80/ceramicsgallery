"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveCourse } from "@/app/actions/courses";
import { BOOKING_MODES, CANCELLATION, FORMATS, INCLUDED, LEVELS, TECHNIQUES } from "@/lib/courses/meta";
import { createClient } from "@/lib/supabase/client";
import { getPublicImageUrl } from "@/lib/utils/images";
import { prepareImage } from "@/lib/utils/prepare-image";
import type { BookingMode, CancellationPolicy, Course } from "@/types/database";

type Props = { course?: Course | null; studioAddress?: string | null };

const pounds = (p: number | null | undefined) => (p == null ? "" : (p / 100).toFixed(p % 100 ? 2 : 0));

export function CourseForm({ course, studioAddress }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<BookingMode>(course?.booking_mode ?? "dates");
  const [format, setFormat] = useState(course?.format ?? "taster");
  const [policy, setPolicy] = useState<CancellationPolicy>(course?.cancellation_policy ?? "standard");
  const [external, setExternal] = useState(!!course?.external_booking_url);

  async function submit(fd: FormData) {
    setError(null);
    const res = await saveCourse(course?.id ?? null, fd);
    if (res?.error) {
      setError(res.error);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  return (
    <form action={submit} className="flex flex-col gap-10 max-w-3xl">
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>}

      <Section n="1" title="The course">
        <Field label="Title" hint="e.g. “Pottery wheel taster” or “5-week beginners throwing course”">
          <input name="title" required maxLength={120} defaultValue={course?.title ?? ""} className="input-field" />
        </Field>
        <Field label="One-line summary" hint="Shown on listings. Up to 200 characters.">
          <input name="summary" maxLength={200} defaultValue={course?.summary ?? ""} className="input-field" placeholder="Two hours on the wheel. Make two pots and decorate them." />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Format">
            <select name="format" value={format} onChange={(e) => setFormat(e.target.value as Course["format"])} className="input-field">
              {FORMATS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Level">
            <select name="level" defaultValue={course?.level ?? "all"} className="input-field">
              {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Techniques">
          <Chips name="techniques" options={TECHNIQUES} selected={course?.techniques ?? []} />
        </Field>
        <Field label="Description" hint="What happens on the day, who it's for, what it feels like.">
          <textarea name="description" rows={6} defaultValue={course?.description ?? ""} className="input-field" />
        </Field>
        <Field label="What you'll make" hint="Optional">
          <input name="what_youll_make" defaultValue={course?.what_youll_make ?? ""} className="input-field" placeholder="A bowl and a cylinder, ready to glaze" />
        </Field>
        <Field label="Photos" hint="Up to 6. The first one is the cover.">
          <CoursePhotos initial={course?.image_paths ?? []} />
        </Field>
      </Section>

      <Section n="2" title="How people book">
        <div className="grid sm:grid-cols-3 gap-3">
          {BOOKING_MODES.map((m) => (
            <label key={m.value} className={`cursor-pointer rounded-2xl border p-4 transition-colors ${mode === m.value ? "border-ink bg-ink text-paper" : "border-ink/15 bg-white hover:border-ink/40"}`}>
              <input type="radio" name="booking_mode" value={m.value} checked={mode === m.value} onChange={() => setMode(m.value)} className="sr-only" />
              <span className="font-semibold block">{m.label}</span>
              <span className={`text-sm ${mode === m.value ? "text-paper/70" : "text-ink/65"}`}>{m.hint}</span>
            </label>
          ))}
        </div>
        {mode === "dates" && (
          <p className="text-sm text-ink/60">You&apos;ll add dates after saving. People pick a date and request places; you confirm each one.</p>
        )}
        {mode === "ongoing" && (
          <div className="grid sm:grid-cols-[1fr_auto] gap-4">
            <Field label="Timetable" hint="One line per class">
              <textarea name="schedule_text" rows={4} defaultValue={course?.schedule_text ?? ""} className="input-field" placeholder={"Tuesday 10am–12pm\nWednesday 6–8pm"} />
            </Field>
            <Field label="Sessions per block" hint="Price covers this many">
              <input name="sessions_count" type="number" min={1} max={52} defaultValue={course?.sessions_count ?? 4} className="input-field w-28" />
            </Field>
          </div>
        )}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={external} onChange={(e) => setExternal(e.target.checked)} className="mt-1" />
          <span>I already take bookings on my own website. <span className="text-ink/65">Show a “Book on my website” button instead of our request form.</span></span>
        </label>
        {external && (
          <Field label="Your booking page">
            <input name="external_booking_url" type="url" defaultValue={course?.external_booking_url ?? ""} className="input-field" placeholder="https://yourstudio.co.uk/book" />
          </Field>
        )}
      </Section>

      <Section n="3" title="Price, places and practicalities">
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={mode === "ongoing" ? "Price per block (£)" : "Price per person (£)"}>
            <input name="price" required inputMode="decimal" defaultValue={pounds(course?.price_pence)} className="input-field" placeholder="70" />
          </Field>
          <Field label="Length (hours)" hint={mode === "ongoing" ? "Per class" : undefined}>
            <input name="duration_hours" inputMode="decimal" defaultValue={course?.duration_minutes ? String(course.duration_minutes / 60) : ""} className="input-field" placeholder="2" />
          </Field>
          <Field label="Max class size">
            <input name="max_places" type="number" min={1} max={100} defaultValue={course?.max_places ?? 6} className="input-field" />
          </Field>
        </div>
        {(format === "one_to_one" || format === "private_group" || mode === "on_request") && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Private session price (£)" hint="Optional: a fixed price for the whole group">
              <input name="private_price" inputMode="decimal" defaultValue={pounds(course?.private_price_pence)} className="input-field" placeholder="230" />
            </Field>
            <Field label="…for up to this many people">
              <input name="private_max_people" type="number" min={1} max={50} defaultValue={course?.private_max_people ?? ""} className="input-field" />
            </Field>
          </div>
        )}
        <Field label="What's included">
          <Chips name="included" options={INCLUDED} selected={course?.included ?? ["clay", "tools", "firing"]} />
        </Field>
        <div className="grid sm:grid-cols-[auto_1fr] gap-4">
          <Field label="Pieces fired">
            <input name="pieces_fired" type="number" min={0} max={50} defaultValue={course?.pieces_fired ?? ""} className="input-field w-28" placeholder="2" />
          </Field>
          <Field label="Extras" hint="Optional: anything charged separately">
            <input name="extras" defaultValue={course?.extras ?? ""} className="input-field" placeholder="Extra pieces fired at £5 each" />
          </Field>
        </div>
        <Field label="Collecting your work" hint="Optional">
          <input name="collection_info" defaultValue={course?.collection_info ?? ""} className="input-field" placeholder="Fired pieces are ready to collect about 4 weeks later" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Experience needed" hint="Optional">
            <input name="prerequisites" defaultValue={course?.prerequisites ?? ""} className="input-field" placeholder="None, complete beginners welcome" />
          </Field>
          <Field label="Minimum age" hint="Optional">
            <input name="min_age" type="number" min={0} max={99} defaultValue={course?.min_age ?? ""} className="input-field w-28" />
          </Field>
        </div>
        {format !== "online" && (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Venue name" hint="Leave blank if it's your studio">
              <input name="venue_name" defaultValue={course?.venue_name ?? ""} className="input-field" />
            </Field>
            <Field label="Venue address" hint={studioAddress ? "Leave blank to use your studio address" : undefined}>
              <textarea name="venue_address" rows={2} defaultValue={course?.venue_address ?? ""} className="input-field" placeholder={studioAddress ?? ""} />
            </Field>
          </div>
        )}
      </Section>

      <Section n="4" title="Cancellations">
        <div className="flex flex-col gap-2">
          {(Object.keys(CANCELLATION) as (keyof typeof CANCELLATION)[]).map((k) => (
            <label key={k} className="flex gap-3 items-start text-sm cursor-pointer">
              <input type="radio" name="cancellation_policy" value={k} checked={policy === k} onChange={() => setPolicy(k)} className="mt-1" />
              <span><strong>{CANCELLATION[k].label}.</strong> <span className="text-ink/65">{CANCELLATION[k].text}</span></span>
            </label>
          ))}
          <label className="flex gap-3 items-start text-sm cursor-pointer">
            <input type="radio" name="cancellation_policy" value="custom" checked={policy === "custom"} onChange={() => setPolicy("custom")} className="mt-1" />
            <span><strong>My own policy</strong></span>
          </label>
          {policy === "custom" && (
            <textarea name="cancellation_text" rows={3} defaultValue={course?.cancellation_text ?? ""} className="input-field mt-1" />
          )}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 px-4 py-4 bg-paper/95 backdrop-blur border-t border-ink/10 flex items-center gap-3">
        <SaveButton isNew={!course} />
        <p className="text-sm text-ink/65">{course ? (course.is_published ? "Changes show straight away." : "Saved as a draft until you publish.") : "Saved as a draft. You can publish it next."}</p>
      </div>
    </form>
  );
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary px-6 py-3 disabled:opacity-50">
      {pending ? "Saving…" : isNew ? "Save course" : "Save changes"}
    </button>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="flex items-baseline gap-3 border-b border-ink/15 pb-3">
        <span className="font-display italic text-terracotta text-lg">{n}</span>
        <span className="font-display text-2xl text-ink">{title}</span>
      </h2>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}{hint && <span className="font-normal text-ink/65"> · {hint}</span>}</span>
      {children}
    </label>
  );
}

function Chips({ name, options, selected }: { name: string; options: { value: string; label: string }[]; selected: string[] }) {
  return (
    <span className="flex flex-wrap gap-2">
      {options.map((o) => (
        <span key={o.value}>
          <input type="checkbox" id={`${name}-${o.value}`} name={name} value={o.value} defaultChecked={selected.includes(o.value)} className="peer sr-only" />
          <label htmlFor={`${name}-${o.value}`} className="inline-block cursor-pointer select-none rounded-full border border-ink/20 px-3.5 py-1.5 text-sm text-ink/70 peer-checked:bg-ink peer-checked:text-paper peer-checked:border-ink peer-focus-visible:ring-2 peer-focus-visible:ring-terracotta">
            {o.label}
          </label>
        </span>
      ))}
    </span>
  );
}

function CoursePhotos({ initial }: { initial: string[] }) {
  const [paths, setPaths] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setErr(null);
    const supabase = createClient();
    const added: string[] = [];
    for (const original of Array.from(files).slice(0, 6 - paths.length)) {
      try {
        const { file, ext } = await prepareImage(original);
        const path = `courses/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("piece-images").upload(path, file);
        if (error) throw error;
        added.push(path);
      } catch {
        setErr("One photo couldn't be uploaded. Try a JPEG or PNG.");
      }
    }
    setPaths((p) => [...p, ...added]);
    setBusy(false);
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); add(e.dataTransfer.files); }}
      className="flex flex-wrap gap-3"
    >
      {paths.map((p, i) => (
        <div key={p} className="relative w-28 h-28 rounded-xl overflow-hidden bg-clay-100">
          <input type="hidden" name="image_paths" value={p} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getPublicImageUrl(p)} alt="" className="w-full h-full object-cover" />
          {i === 0 && <span className="absolute left-1.5 top-1.5 text-[10px] bg-ink text-paper rounded px-1.5 py-0.5">Cover</span>}
          <button type="button" onClick={() => setPaths(paths.filter((x) => x !== p))} className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-paper/90 text-ink text-sm leading-none" aria-label="Remove photo">×</button>
        </div>
      ))}
      {paths.length < 6 && (
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="w-28 h-28 rounded-xl border-2 border-dashed border-ink/20 hover:border-ink/50 text-sm text-ink/65 flex items-center justify-center text-center px-2">
          {busy ? "Uploading…" : "+ Add photos"}
        </button>
      )}
      <input ref={ref} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      {err && <p role="alert" className="w-full text-sm text-red-700">{err}</p>}
    </div>
  );
}
