"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Calendar,
  ImageIcon,
  Settings,
  Search,
  Bell,
  HelpCircle,
  Menu,
  X,
  User,
  LogOut,
  LifeBuoy,
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
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const currentPage = navItems.find((i) => pathname?.startsWith(i.href))?.label || "De Vega";

  // Close menus on Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close menus on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNavigate = (href: string) => {
    setMenuOpen(false);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Topbar */}
      <header className="sticky top-0 z-50 h-14 border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center justify-between h-full px-4">
          {/* Left: Menu toggle + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setMenuOpen(!menuOpen); setUserMenuOpen(false); }}
              className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <button
              onClick={() => { setMenuOpen(!menuOpen); setUserMenuOpen(false); }}
              className="flex items-center gap-2"
            >
              <span className="text-lg font-bold text-on-surface tracking-tight">De Vega</span>
            </button>
          </div>

          {/* Center: Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full bg-surface-low border border-outline-variant rounded-lg pl-9 pr-4 py-1.5 text-body-md text-on-surface placeholder-on-surface-variant focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors outline-none"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <button className="relative p-2 rounded-lg hover:bg-surface-container transition-colors">
              <Bell size={18} className="text-on-surface-variant" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full" />
            </button>
            <button className="p-2 rounded-lg hover:bg-surface-container transition-colors">
              <HelpCircle size={18} className="text-on-surface-variant" />
            </button>

            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setUserMenuOpen(!userMenuOpen); setMenuOpen(false); }}
                className="flex items-center gap-2 ml-2 p-1.5 rounded-lg hover:bg-surface-container transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-white font-semibold text-xs">
                  B
                </div>
                <span className="hidden sm:block text-body-md text-on-surface font-medium">Brandon</span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-outline-variant rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                  <div className="p-2">
                    <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
                      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-white font-semibold text-sm">
                        B
                      </div>
                      <div>
                        <p className="text-body-md text-on-surface font-medium">Brandon</p>
                        <p className="text-label-sm text-on-surface-variant">Admin</p>
                      </div>
                    </div>
                    <hr className="border-outline-variant my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); router.push("/settings"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <User size={16} className="text-on-surface-variant" />
                      Perfil
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors">
                      <LifeBuoy size={16} className="text-on-surface-variant" />
                      Soporte
                    </button>
                    <hr className="border-outline-variant my-1" />
                    <button
                      onClick={() => { setUserMenuOpen(false); router.push("/login"); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-md text-error hover:bg-error-container transition-colors"
                    >
                      <LogOut size={16} />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-down Menu */}
      {menuOpen && (
        <div ref={menuRef} className="absolute top-14 left-0 right-0 z-40 bg-white border-b border-outline-variant shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-5xl mx-auto px-4 py-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <button
                  key={item.href}
                  onClick={() => handleNavigate(item.href)}
                  className={isActive ? "dropdown-item-active" : "dropdown-item"}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick stats */}
          <div className="border-t border-outline-variant">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6 text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Sistema activo
              </span>
              <span>3 publicaciones hoy</span>
              <span>847 imágenes generadas</span>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="p-4 md:p-8">{children}</main>
    </div>
  );
}
