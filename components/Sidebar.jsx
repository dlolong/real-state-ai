"use client";

import Link from "next/link";
import AppLogo from "@/components/AppLogo";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "📊",
  },
  {
    label: "Deal Finder",
    href: "/deals",
    icon: "🏡",
  },
  {
    label: "Map View",
    href: "/map",
    icon: "🗺",
  },
  {
    label: "CRM Leads",
    href: "/leads",
    icon: "📋",
  },
  {
    label: "County Detector",
    href: "/county-detector",
    icon: "🔥",
  },
  {
    label: "Data Sources",
    href: "/sources",
    icon: "🧩",
  },
];

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside className="w-full md:w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* BRAND */}
      <div className="p-5 md:p-6 border-b border-slate-800">
         <AppLogo />
        <p className="text-xs text-gray-400 mt-1">
          Real Estate OS
        </p>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-3 md:py-2 rounded-xl transition ${
                active
                  ? "bg-white text-black font-semibold shadow-sm"
                  : "text-gray-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-slate-800">
        <Link
          href="/logout"
          onClick={onNavigate}
          className="block w-full text-left px-3 py-3 md:py-2 rounded-xl hover:bg-slate-800 transition text-red-400"
        >
          ⎋ Logout
        </Link>
      </div>
    </aside>
  );
}