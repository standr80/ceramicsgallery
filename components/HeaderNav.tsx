"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signOut } from "@/app/actions/auth";

// Lock body scroll when mobile menu is open
function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (locked) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [locked]);
}

interface HeaderNavProps {
  isAdmin: boolean;
  isPotter: boolean;
}

const linkClass = "text-stone-600 hover:text-clay-600 font-medium transition-colors";
const mobileLinkClass = "block py-3 text-lg text-stone-900 hover:text-clay-600 font-medium transition-colors";

export function HeaderNav({ isAdmin, isPotter }: HeaderNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  useLockBodyScroll(mobileOpen);

  return (
    <>
      {/* Desktop nav - hidden on mobile */}
      <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
        <Link href="/" className={linkClass}>
          Home
        </Link>
        <Link href="/#potters" className={linkClass}>
          Potters
        </Link>
        <Link href="/courses" className={linkClass}>
          Courses
        </Link>
        {isAdmin && (
          <Link href="/admin" className={linkClass}>
            Admin
          </Link>
        )}
        {isPotter ? (
          <>
            <Link href="/dashboard" className={linkClass}>
              Dashboard
            </Link>
            <form action={signOut} className="inline">
              <button type="submit" className={linkClass}>
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className={linkClass}>
              Log in
            </Link>
            <Link href="/signup" className="btn-primary text-sm">
              Join as a Potter
            </Link>
          </>
        )}
      </nav>

      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden p-2 -mr-2 text-stone-900 hover:text-clay-600 transition-colors"
        aria-label="Open menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm z-40 md:hidden"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-2xl z-50 md:hidden flex flex-col"
            role="dialog"
            aria-label="Mobile menu"
          >
            <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50">
              <span className="font-display text-lg font-semibold text-stone-900">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2 text-stone-900 hover:text-clay-600 transition-colors"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4 gap-1" aria-label="Mobile navigation">
              <Link href="/" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Home
              </Link>
              <Link href="/#potters" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Potters
              </Link>
              <Link href="/courses" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                Courses
              </Link>
              {isAdmin && (
                <Link href="/admin" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                  Admin
                </Link>
              )}
              {isPotter ? (
                <>
                  <Link href="/dashboard" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                    Dashboard
                  </Link>
                  <form action={signOut} className="block">
                    <button type="submit" className={`${mobileLinkClass} w-full text-left`}>
                      Log out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    className="block py-3 mt-4 pt-4 text-lg font-semibold text-clay-700 hover:text-clay-600 border-t border-stone-200 transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    Join as a Potter
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
