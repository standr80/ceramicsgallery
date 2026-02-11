"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 border-b border-clay-200/60">
      <ul className="flex gap-6">
        <li>
          <Link
            href="/dashboard"
            className={`block border-b-2 pb-3 text-sm font-medium ${
              pathname === "/dashboard"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-stone-600 hover:text-clay-600"
            }`}
          >
            Overview
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/profile"
            className={`block border-b-2 pb-3 text-sm font-medium ${
              pathname === "/dashboard/profile"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-stone-600 hover:text-clay-600"
            }`}
          >
            Profile
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/add-product"
            className={`block border-b-2 pb-3 text-sm font-medium ${
              pathname === "/dashboard/add-product"
                ? "border-clay-600 text-clay-700"
                : "border-transparent text-stone-600 hover:text-clay-600"
            }`}
          >
            Add product
          </Link>
        </li>
      </ul>
    </nav>
  );
}
