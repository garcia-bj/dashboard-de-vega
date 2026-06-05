"use client";

import { useState, useEffect, useRef } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  User,
  LogOut,
  LifeBuoy,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wand2, label: "Generar", href: "/generate" },
  { icon: Calendar, label: "Programar", href: "/schedule" },
  { icon: ImageIcon, label: "Galería", href: "/media" },
  { icon: Settings, label: "Configuración", href: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentPage = navItems.find((i) => pathname?.startsWith(i.href))?.label || "De Vega";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUserMenuOpen(false);
      if (e.ctrlKey && e.key === "b") { e.preventDefault(); setCollapsed((c) => !c); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ─── Sidebar ─── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-tertiary transition-all duration-300 ease-in-out ${
          collapsed ? "w-[64px]" : "w-[260px]"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-white/5 flex-shrink-0">
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className="p-2 rounded hover:bg-white/10 text-surface-dim hover:text-white transition-colors mx-auto"
              title="Expandir menú"
            >
              <Sparkles size={22} className="text-secondary" />
            </button>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
                <Sparkles size={20} className="text-secondary flex-shrink-0" />
                <span className="text-lg font-bold text-white tracking-tight truncate">De Vega</span>
              </Link>
              <button
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded hover:bg-white/10 text-surface-dim hover:text-white transition-colors flex-shrink-0"
                title="Colapsar menú"
              >
                <PanelLeftClose size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded transition-all duration-150 ${
                  collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-white/10 text-white font-semibold"
                    : "text-surface-dim hover:text-white hover:bg-white/5 font-medium"
                }`}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="text-body-md truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className={`px-3 py-3 border-t border-white/5 flex-shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-secondary/40 transition-all"
            >
              B
            </button>
          ) : (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full px-2 py-1.5 rounded hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  B
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-white text-body-md font-medium truncate">Brandon</p>
                  <p className="text-surface-dim text-label-sm">Admin</p>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute left-0 bottom-full mb-1 w-52 bg-white border border-outline-variant rounded-md shadow-lg z-50 overflow-hidden animate-in origin-bottom-left">
                  <div className="p-1.5">
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-body-md text-on-surface hover:bg-surface-container transition-colors">
                      <User size={16} className="text-on-surface-variant" />
                      Perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-body-md text-on-surface hover:bg-surface-container transition-colors">
                      <LifeBuoy size={16} className="text-on-surface-variant" />
                      Soporte
                    </button>
                    <hr className="border-outline-variant my-1 mx-2" />
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded text-body-md text-error hover:bg-error-container transition-colors">
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? "ml-[64px]" : "ml-[260px]"}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 border-b border-black/5 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
                title="Expandir menú"
              >
                <PanelLeftOpen size={18} />
              </button>
            )}
            <h2 className="text-headline-lg text-on-surface">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-56 bg-surface-low border border-outline-variant rounded pl-9 pr-4 py-1.5 text-body-md text-on-surface placeholder-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all outline-none"
              />
            </div>
            <button className="relative p-2 rounded hover:bg-surface-container transition-colors">
              <Bell size={18} className="text-on-surface-variant" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
            </button>
            <button className="p-2 rounded hover:bg-surface-container transition-colors">
              <HelpCircle size={18} className="text-on-surface-variant" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
