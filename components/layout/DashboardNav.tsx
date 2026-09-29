"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard/studio", label: "Pots" },
  { href: "/dashboard/courses", label: "Courses" },
  { href: "/dashboard/profile", label: "Profile" },
  { href: "/dashboard/connect-stripe", label: "Payments" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardNav() {
  const path = usePathname();
  return (
    <nav className="flex gap-1 border-b border-clay-200/60 bg-white px-4 sm:px-6 overflow-x-auto">
      {links.map(({ href, label }) => {
        const active = path === href || path.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`shrink-0 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-clay-600 text-clay-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
