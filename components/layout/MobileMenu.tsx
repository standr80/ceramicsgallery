"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { signOut } from "@/app/actions/auth";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/potters", label: "Potters" },
  { href: "/courses", label: "Courses" },
  { href: "/news", label: "News" },
  { href: "/merch", label: "Merch" },
];

export function MobileMenu({ signedIn, admin = false }: { signedIn: boolean; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="w-10 h-10 -mr-2 flex items-center justify-center rounded-lg text-ink hover:bg-ink/5"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && mounted && createPortal(
        <div id="mobile-menu" className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-paper border-t border-ink/10 px-6 py-8 flex flex-col">
          <nav className="flex flex-col">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`font-display text-4xl py-3 border-b border-ink/10 ${pathname.startsWith(l.href) ? "text-terracotta" : "text-ink"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto flex flex-col gap-3">
            {signedIn ? (
              <>
                <Link href="/dashboard/studio" className="btn-primary py-3.5 text-base">Your studio</Link>
                <form action={signOut}>
                  <button className="btn-secondary py-3.5 text-base w-full">Sign out</button>
                </form>
              </>
            ) : (
              <>
                <Link href="/signup" className="btn-primary py-3.5 text-base">Join as a potter</Link>
                <Link href="/login" className="btn-secondary py-3.5 text-base">Potter sign in</Link>
              </>
            )}
            {admin && <Link href="/admin" className="text-center text-sm text-ink/65 py-2">Admin</Link>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
