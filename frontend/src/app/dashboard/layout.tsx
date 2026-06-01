"use client";

import Link from "next/link";
import { LayoutDashboard, Wand2, Calendar, ImageIcon, Settings } from "lucide-react";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wand2, label: "Generar", href: "/generate" },
  { icon: Calendar, label: "Programar", href: "/schedule" },
  { icon: ImageIcon, label: "Media", href: "/media" },
  { icon: Settings, label: "Ajustes", href: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-6">
        <Link href="/" className="text-2xl font-bold text-brand-500">
          De Vega
        </Link>
        <nav className="flex flex-col gap-2">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
