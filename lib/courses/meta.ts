import type { BookingMode, CancellationPolicy, CourseFormat, CourseLevel, Meeting } from "@/types/database";

export const FORMATS: { value: CourseFormat; label: string }[] = [
  { value: "taster", label: "Taster session" },
  { value: "one_day", label: "One day" },
  { value: "weekend", label: "Weekend" },
  { value: "weekly", label: "Multi-week course" },
  { value: "one_to_one", label: "1:1 lesson" },
  { value: "private_group", label: "Private group or party" },
  { value: "online", label: "Online" },
];

export const LEVELS: { value: CourseLevel; label: string }[] = [
  { value: "all", label: "All abilities" },
  { value: "beginner", label: "Beginners" },
  { value: "improver", label: "Improvers" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const TECHNIQUES = [
  { value: "wheel", label: "Wheel throwing" },
  { value: "handbuilding", label: "Handbuilding" },
  { value: "glazing", label: "Glazing" },
  { value: "decorating", label: "Decorating" },
  { value: "sculpture", label: "Sculpture" },
  { value: "raku", label: "Raku & firing" },
];

export const INCLUDED = [
  { value: "clay", label: "Clay & materials" },
  { value: "tools", label: "Tools & apron" },
  { value: "firing", label: "Firing" },
  { value: "glazing", label: "Glazing" },
  { value: "refreshments", label: "Tea, coffee & cake" },
  { value: "lunch", label: "Lunch" },
];

export const BOOKING_MODES: { value: BookingMode; label: string; hint: string }[] = [
  { value: "dates", label: "Set dates", hint: "Fixed dates with a limited number of places." },
  { value: "on_request", label: "On request", hint: "1:1 lessons, private groups, parties. People ask for a date." },
  { value: "ongoing", label: "Ongoing weekly classes", hint: "A regular timetable people can join." },
];

export const CANCELLATION: Record<Exclude<CancellationPolicy, "custom">, { label: string; text: string }> = {
  flexible: {
    label: "Flexible",
    text: "Full refund or transfer to another date if you cancel at least 48 hours before.",
  },
  standard: {
    label: "Standard",
    text: "Full refund or transfer if you cancel at least 7 days before. After that, places can't be refunded but can be passed to a friend.",
  },
  strict: {
    label: "Strict",
    text: "Places are non-refundable, but can be transferred to another date with 14 days' notice or passed to a friend.",
  },
};

export const label = <T extends string>(list: { value: T; label: string }[], v: T | string | null | undefined) =>
  list.find((x) => x.value === v)?.label ?? "";

export function cancellationText(policy: CancellationPolicy, custom: string | null) {
  return policy === "custom" ? custom ?? "" : CANCELLATION[policy].text;
}

/** Hold time for unconfirmed requests. */
export const HOLD_HOURS = 48;

const TZ = "Europe/London";

/** Convert a UK wall-clock date ("2026-12-05") and time ("10:00") to a UTC ISO string. */
export function londonToUtc(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  // Offset of London from UTC at that moment (0 or +60 minutes).
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(new Date(guess));
  const lh = Number(parts.find((p) => p.type === "hour")!.value) % 24;
  const lm = Number(parts.find((p) => p.type === "minute")!.value);
  let offset = (lh * 60 + lm) - (hh * 60 + mm);
  if (offset > 720) offset -= 1440;
  if (offset < -720) offset += 1440;
  return new Date(guess - offset * 60000).toISOString();
}

export function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
}
export function fmtDayLong(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "numeric", minute: "2-digit", hour12: true }).replace(":00", "").replace(/\s/g, "").toLowerCase();
}
export function fmtTimeRange(m: Meeting) {
  return `${fmtTime(m.starts_at)}–${fmtTime(m.ends_at)}`;
}
export function fmtPrice(pence: number) {
  return `£${(pence / 100).toFixed(pence % 100 ? 2 : 0)}`;
}
export function fmtDuration(mins: number | null) {
  if (!mins) return "";
  const h = Math.floor(mins / 60), m = mins % 60;
  return h ? `${h} hr${h > 1 ? "s" : ""}${m ? ` ${m} min` : ""}` : `${m} min`;
}
