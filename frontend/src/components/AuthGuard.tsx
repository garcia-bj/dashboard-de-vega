"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Loader2 } from "lucide-react";

const publicPaths = ["/", "/login"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthStore((s) => s.token);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (!stored && !publicPaths.includes(pathname || "")) {
      router.replace("/login");
    } else {
      setChecking(false);
    }
  }, [pathname, router, token]);

  if (checking && !publicPaths.includes(pathname || "")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
