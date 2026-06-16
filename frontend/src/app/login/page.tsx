"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data: any = await api.auth.login(email, password);
      setAuth(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12 xl:p-16"
        style={{ background: "hsl(var(--sidebar))" }}>
        {/* Ambient glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, hsl(342 62% 44%), transparent 70%)" }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-15"
            style={{ background: "radial-gradient(circle, hsl(25 95% 55%), transparent 70%)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="De Vega" className="w-9 h-9 object-contain" />
          <span className="text-xl font-bold text-white tracking-tight">De Vega</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <p className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.15] tracking-tight">
              Crea.<br />Programa.<br />
              <span style={{ color: "hsl(var(--secondary))" }}>Publica.</span>
            </p>
          </div>
          <p className="text-sidebar-muted leading-relaxed text-sm max-w-xs">
            Genera imágenes con IA usando Gemini, DALL·E 3 y Flux. Publica automáticamente en Facebook, Instagram y Stories.
          </p>
          <div className="flex gap-5 pt-2">
            {[
              { label: "Gemini", color: "hsl(var(--secondary))" },
              { label: "DALL·E 3", color: "hsl(var(--primary))" },
              { label: "Flux", color: "hsl(var(--sidebar-muted))" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="text-xs text-sidebar-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-sidebar-muted">
            &copy; {new Date().getFullYear()} De Vega — AI Media Studio
          </p>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-[380px] space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <img src="/logo.png" alt="De Vega" className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-foreground tracking-tight">De Vega</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground">Accede al centro de gestión</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Correo Electrónico</Label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tuempresa.com"
                  required
                  className="pl-10 h-11 bg-card border-border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Contraseña</Label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 h-11 bg-card border-border rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: loading ? "hsl(var(--primary))" : "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Ingresando...</>
              ) : (
                <><ArrowRight size={16} /> Entrar</>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground pt-2 border-t border-border">
            De Vega &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
