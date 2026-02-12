"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 border-b border-clay-200/60">
      <ul className="flex gap-6">
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
