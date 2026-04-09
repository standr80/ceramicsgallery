"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface DashboardNavProps {
  draftCount?: number;
}

export function DashboardNav({ draftCount = 0 }: DashboardNavProps) {
  const pathname = usePathname();

  const linkClass = (href: string) =>
    `block border-b-2 pb-3 text-sm font-medium ${
      pathname === href
        ? "border-clay-600 text-clay-700"
        : "border-transparent text-stone-600 hover:text-clay-600"
    }`;

  return (
    <nav className="mb-8 border-b border-clay-200/60">
      <ul className="flex gap-6 flex-wrap">
        <li>
          <Link href="/dashboard" className={linkClass("/dashboard")}>
            Overview
          </Link>
        </li>
        <li>
          <Link href="/dashboard/profile" className={linkClass("/dashboard/profile")}>
            Profile
          </Link>
        </li>
        <li>
          <Link href="/dashboard/connect-stripe" className={linkClass("/dashboard/connect-stripe")}>
            Payments
          </Link>
        </li>
        <li>
          <Link href="/dashboard/add-product" className={linkClass("/dashboard/add-product")}>
            Add product
          </Link>
        </li>
        <li>
          <Link href="/dashboard/drafts" className={linkClass("/dashboard/drafts")}>
            <span className="flex items-center gap-1.5">
              Drafts
              {draftCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-white text-xs font-semibold w-5 h-5 leading-none">
                  {draftCount}
                </span>
              )}
            </span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
