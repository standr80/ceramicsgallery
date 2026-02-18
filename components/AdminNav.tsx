"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface AdminNavProps {
  hasPotter?: boolean;
}

export function AdminNav({ hasPotter }: AdminNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const potterMatch = pathname.match(/^\/admin\/potters\/([a-f0-9-]+)$/);
  const potterId = potterMatch?.[1];
  const isProfileTab = potterId && searchParams.get("tab") === "profile";

  return (
    <nav className="mb-8 border-b border-clay-200/60">
      <ul className="flex gap-6 flex-wrap">
        <li>
          <Link
            href="/admin"
            className={`block border-b-2 pb-3 text-sm font-medium ${
              pathname === "/admin" || pathname.startsWith("/admin/potters/")
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-stone-600 hover:text-clay-600"
            }`}
          >
            Potters
          </Link>
        </li>
        {potterId && (
          <li>
            <Link
              href={`/admin/potters/${potterId}?tab=profile`}
              className={`block border-b-2 pb-3 text-sm font-medium ${
                isProfileTab
                  ? "border-clay-600 text-clay-700"
                  : "border-transparent text-stone-600 hover:text-clay-600"
              }`}
            >
              Profile
            </Link>
          </li>
        )}
        {!hasPotter && (
          <li>
            <Link
              href="/admin/create-potter-profile"
              className={`block border-b-2 pb-3 text-sm font-medium ${
                pathname === "/admin/create-potter-profile"
                  ? "border-clay-600 text-clay-700"
                  : "border-transparent text-stone-600 hover:text-clay-600"
              }`}
            >
              Create potter profile
            </Link>
          </li>
        )}
        <li>
          <Link
            href="/admin/settings"
            className={`block border-b-2 pb-3 text-sm font-medium ${
              pathname === "/admin/settings"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-stone-600 hover:text-clay-600"
            }`}
          >
            Settings
          </Link>
        </li>
      </ul>
    </nav>
  );
}
