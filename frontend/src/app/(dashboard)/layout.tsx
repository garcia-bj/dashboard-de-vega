"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Wand2, Calendar, ImageIcon, LogOut, User as UserIcon } from "lucide-react";
import { useAuthStore } from "../../store/auth";

const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wand2, label: "Generar", href: "/generate" },
  { icon: Calendar, label: "Programar", href: "/schedule" },
  { icon: ImageIcon, label: "Media", href: "/media" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/");
    } else {
      setLoading(false);
    }
  }, [token, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-sm font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col gap-6">
        <Link href="/dashboard" className="text-2xl font-bold text-brand-500 hover:opacity-90 transition-opacity">
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

        {/* User profile & logout at the bottom */}
        <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col gap-4">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="h-9 w-9 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center text-zinc-300 flex-shrink-0">
                <UserIcon size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-zinc-200 truncate">
                  {user.full_name || "Usuario"}
                </span>
                <span className="text-xs text-zinc-500 truncate">{user.email}</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors w-full text-left font-medium"
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-zinc-950 overflow-y-auto">{children}</main>
    </div>
  );
}
