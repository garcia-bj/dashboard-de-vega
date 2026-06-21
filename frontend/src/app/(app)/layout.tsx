"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster } from "sonner";
import { useAuthStore } from "@/store/auth";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Wand2, Calendar, CalendarDays, ImageIcon, Settings,
  Bell, PanelLeftClose, PanelLeftOpen,
  User, LogOut, LifeBuoy, Menu, Search,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",   href: "/dashboard" },
  { icon: Wand2,           label: "Generar",     href: "/generate" },
  { icon: Calendar,        label: "Programar",   href: "/schedule" },
  { icon: CalendarDays,    label: "Calendario",  href: "/calendar" },
  { icon: ImageIcon,       label: "Galería",     href: "/media" },
  { icon: Settings,        label: "Configuración", href: "/settings" },
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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
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

  const NavLink = ({ item, mobile = false }: { item: typeof navItems[0]; mobile?: boolean }) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "flex items-center gap-3 rounded-lg transition-all duration-150 relative group",
          collapsed && !mobile ? "justify-center px-2 py-2.5" : "px-3 py-2.5",
          isActive
            ? "bg-white/[0.08] text-white"
            : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-white/[0.04]"
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-sidebar-accent" />
        )}
        <item.icon size={18} className={cn("flex-shrink-0", isActive && "text-sidebar-accent")} />
        {(mobile || !collapsed) && (
          <span className="text-sm font-medium">{item.label}</span>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full" style={{ background: "hsl(var(--sidebar))" }}>
      {/* Logo */}
      <div className={cn(
        "flex items-center border-b border-white/[0.06] flex-shrink-0 h-14",
        collapsed && !mobile ? "justify-center px-2" : "px-4"
      )}>
        {collapsed && !mobile ? (
          <button onClick={() => setCollapsed(false)} className="p-2 rounded-lg hover:bg-white/10 transition-colors" title="Expandir">
            <img src="/logo.png" alt="De Vega" className="w-5 h-5 object-contain" />
          </button>
        ) : (
          <div className="flex items-center justify-between w-full">
            <Link href="/dashboard" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
              <img src="/logo.png" alt="De Vega" className="w-7 h-7 object-contain" />
              <span className="text-[15px] font-bold text-white tracking-tight">De Vega</span>
            </Link>
            {!mobile && (
              <button onClick={() => setCollapsed(true)} className="p-1.5 rounded-lg hover:bg-white/10 text-sidebar-muted hover:text-white transition-colors" title="Colapsar">
                <PanelLeftClose size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => <NavLink key={item.href} item={item} mobile={mobile} />)}
      </nav>

      {/* User */}
      <div className={cn(
        "px-2.5 py-3 border-t border-white/[0.06] flex-shrink-0",
        collapsed && !mobile && "flex justify-center"
      )}>
        {collapsed && !mobile ? (
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm"
          >
            B
          </button>
        ) : (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 w-full px-2.5 py-2 rounded-lg hover:bg-white/[0.06] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                B
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sidebar-foreground text-sm font-semibold truncate leading-tight">Brandon</p>
                <p className="text-sidebar-muted text-xs leading-tight">Admin</p>
              </div>
            </button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 bottom-full mb-2 w-52 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="p-1.5">
                    <Link href="/settings" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                      <User size={15} /> Perfil
                    </Link>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent transition-colors">
                      <LifeBuoy size={15} /> Soporte
                    </button>
                    <div className="my-1 border-t border-border" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut size={15} /> Cerrar sesión
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
      <Toaster position="top-right" richColors closeButton theme="dark" />

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ type: "spring", stiffness: 380, damping: 32 }}
        className="hidden lg:flex fixed inset-y-0 left-0 z-40 border-r border-white/[0.06]"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 border-r border-white/[0.06]">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Main */}
      <motion.div
        animate={{ marginLeft: isDesktop ? (collapsed ? 64 : 256) : 0 }}
        transition={isDesktop ? { type: "spring", stiffness: 380, damping: 32 } : { duration: 0 }}
        className="flex-1 flex flex-col min-h-screen"
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            {collapsed && (
              <button onClick={() => setCollapsed(false)} className="hidden lg:flex p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <PanelLeftOpen size={18} />
              </button>
            )}
            <h2 className="text-base font-semibold text-foreground">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg bg-muted border border-border text-muted-foreground text-sm w-44 md:w-56">
              <Search size={14} className="flex-shrink-0" />
              <span className="text-xs">Buscar...</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-sidebar-accent rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </motion.div>
    </div>
  );
}
