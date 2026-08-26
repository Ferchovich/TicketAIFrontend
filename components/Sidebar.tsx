"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    ),
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2h12a1 1 0 0 1 1 1v18l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21V3a1 1 0 0 1 1-1z" />
        <path d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    href: "/categorias",
    label: "Categorías",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.83 8.83a2 2 0 0 0 2.83 0l7.17-7.17a2 2 0 0 0 0-2.83z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[232px] shrink-0 bg-surface border-r border-border flex flex-col p-5 px-4">
      <div className="flex items-center gap-2.5 px-2 pb-6 pt-1">
        <div className="w-7 h-7 rounded-[7px] bg-accent flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2h12a1 1 0 0 1 1 1v18l-2.5-1.5L14 21l-2.5-1.5L9 21l-2.5-1.5L4 21V3a1 1 0 0 1 1-1z" />
            <path d="M8 7h8M8 11h8M8 15h5" />
          </svg>
        </div>
        <span className="text-[15px] font-semibold tracking-tight">Facturas</span>
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-sm font-medium ${
                active ? "bg-accent-subtle text-accent" : "text-ink-2 hover:bg-bg"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex items-center gap-2.5 pt-4 border-t border-border">
        <div className="w-[30px] h-[30px] rounded-full bg-border flex items-center justify-center text-xs font-semibold text-ink-2 shrink-0">
          NI
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
            Nortec Insumos SRL
          </div>
          <div className="text-xs text-ink-muted">Cuenta principal</div>
        </div>
      </div>
    </aside>
  );
}
