"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Calendar,
  ImageIcon,
  Settings,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wand2, label: "Generar Imagen", href: "/generate" },
  { icon: Calendar, label: "Programar", href: "/schedule" },
  { icon: ImageIcon, label: "Galería", href: "/media" },
  { icon: Settings, label: "Configuración", href: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getTitle = () => {
    const item = navItems.find((i) => pathname?.startsWith(i.href));
    return item ? item.label : "Dashboard";
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="w-[280px] bg-tertiary flex flex-col fixed inset-y-0 left-0 z-40">
        {/* Logo */}
        <div className="px-6 pt-8 pb-6 border-b border-white/5">
          <Link href="/" className="block">
            <h1 className="text-2xl font-bold text-white tracking-tight">De Vega</h1>
            <p className="text-surface-dim text-label-sm mt-1">IA · Media Studio</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "sidebar-link-active" : "sidebar-link"}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white font-semibold text-sm">
              B
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-body-md font-medium truncate">Brandon</p>
              <p className="text-surface-dim text-label-sm">Admin</p>
            </div>
            <ChevronDown size={16} className="text-surface-dim" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-[280px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-md border-b border-outline-variant">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h2 className="text-headline-lg text-on-surface">{getTitle()}</h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="input-field pl-10 w-72 text-body-md"
                />
              </div>

              <button className="relative p-2 rounded-lg hover:bg-surface-container transition-colors">
                <Bell size={20} className="text-on-surface-variant" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
              </button>

              <button className="p-2 rounded-lg hover:bg-surface-container transition-colors">
                <HelpCircle size={20} className="text-on-surface-variant" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
