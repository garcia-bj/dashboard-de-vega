"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Wand2, Calendar, ImageIcon, Settings,
  Search, Bell, HelpCircle, PanelLeftClose, PanelLeftOpen,
  Sparkles, User, LogOut, LifeBuoy, Menu,
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
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!stored && !token) router.replace("/login");
  }, [token, router]);
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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); setUserMenuOpen(false); router.replace("/login"); };
  const currentPage = navItems.find((i) => pathname?.startsWith(i.href))?.label || "De Vega";

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full bg-sidebar">
      <div className={cn("flex items-center border-b border-white/5 flex-shrink-0", mobile ? "h-14 px-4" : "h-14 px-4")}>
        {collapsed && !mobile ? (
          <button onClick={() => setCollapsed(false)} className="p-2 rounded hover:bg-white/10 mx-auto" title="Expandir">
            <Sparkles size={22} className="text-sidebar-accent" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
              <Sparkles size={20} className="text-sidebar-accent flex-shrink-0" />
              <span className="text-lg font-bold text-sidebar-foreground tracking-tight">De Vega</span>
            </Link>
            {!mobile && (
              <button onClick={() => setCollapsed(true)} className="p-1.5 rounded hover:bg-white/10 text-sidebar-muted hover:text-sidebar-foreground" title="Colapsar">
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded transition-all duration-200 relative overflow-hidden",
                collapsed && !mobile ? "justify-center px-2 py-3" : "px-3 py-2.5",
                isActive
                  ? "bg-white/10 text-sidebar-foreground"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.04]"
              )}
            >
              <item.icon size={20} className="flex-shrink-0 relative z-10" />
              {(mobile || !collapsed) && <span className="text-sm truncate relative z-10">{item.label}</span>}
              {isActive && <span className="absolute right-2 w-1 h-6 rounded-full bg-sidebar-accent" />}
            </Link>
          );
        })}
      </nav>

      <div className={cn("px-3 py-3 border-t border-white/5 flex-shrink-0", collapsed && !mobile && "flex justify-center")}>
        {collapsed && !mobile ? (
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-white font-semibold text-sm">
            B
          </button>
        ) : (
          <div className="relative" ref={userMenuRef}>
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-3 w-full px-2 py-1.5 rounded hover:bg-white/5 transition-colors">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">B</div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sidebar-foreground text-sm font-medium truncate">Brandon</p>
                <p className="text-sidebar-muted text-xs">Admin</p>
              </div>
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute left-0 bottom-full mb-1 w-52 bg-popover border rounded-md shadow-xl z-50 overflow-hidden">
                  <div className="p-1">
                    <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm hover:bg-accent transition-colors">
                      <User size={16} /> Perfil
                    </Link>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm hover:bg-accent transition-colors">
                      <LifeBuoy size={16} /> Soporte
                    </button>
                    <hr className="my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut size={16} /> Cerrar sesión
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster position="top-right" richColors closeButton />

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="hidden lg:flex fixed inset-y-0 left-0 z-40 border-r border-white/5"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <motion.div
        animate={{ marginLeft: collapsed ? 64 : 260 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="flex-1 lg:ml-0"
        style={typeof window !== "undefined" && window.innerWidth >= 1024 ? undefined : { marginLeft: 0 }}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 border-b bg-background/70 backdrop-blur-2xl flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu size={20} />
              </Button>
            </SheetTrigger>
            {collapsed && (
              <button onClick={() => setCollapsed(false)} className="hidden lg:flex p-1.5 rounded hover:bg-accent">
                <PanelLeftOpen size={18} />
              </button>
            )}
            <h2 className="text-lg md:text-2xl font-semibold text-foreground">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar..." className="h-9 w-40 md:w-56 rounded-md border bg-muted/50 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-sidebar-accent rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <HelpCircle size={18} />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </motion.div>
    </div>
  );
}
