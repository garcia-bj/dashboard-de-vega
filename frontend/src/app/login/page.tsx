"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
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
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const data: any = await api.auth.login(email, password);
      setAuth(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar relative overflow-hidden flex-col justify-center px-12 xl:px-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-sidebar to-secondary/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-md bg-sidebar-accent flex items-center justify-center"><Sparkles size={22} className="text-white" /></div>
            <h1 className="text-3xl font-bold text-sidebar-foreground">De Vega</h1>
          </div>
          <p className="text-4xl xl:text-5xl font-bold text-sidebar-foreground leading-tight mb-4">Crea. Programa.<br /><span className="text-sidebar-accent">Publica.</span></p>
          <p className="text-sidebar-muted leading-relaxed text-sm md:text-base">Genera imágenes con IA usando Gemini, DALL·E 3 y Stable Diffusion. Programa y publica automáticamente en Facebook, Instagram y Stories.</p>
          <div className="flex gap-5 mt-10">
            {["Gemini", "DALL·E 3", "Flux + SD"].map((m, i) => (
              <div key={m} className="flex items-center gap-2">
                <div className={["w-2 h-2 rounded-full", i === 0 ? "bg-sidebar-accent" : i === 1 ? "bg-primary" : "bg-sidebar-muted"].join(" ")} />
                <span className="text-xs text-sidebar-muted">{m}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 mt-auto pt-12"><p className="text-xs text-sidebar-muted">&copy; {new Date().getFullYear()} De Vega. AI Media Studio.</p></div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-md bg-secondary flex items-center justify-center"><Sparkles size={18} className="text-white" /></div>
            <h1 className="text-xl font-bold">De Vega</h1>
          </div>
          <div className="mb-8"><h2 className="text-2xl font-semibold mb-1">Iniciar sesión</h2><p className="text-sm text-muted-foreground">Accede al centro de gestión de contenido IA</p></div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-md border border-destructive/20">{error}</div>}
            <div><Label className="text-xs font-semibold mb-1.5 block">Correo Electrónico</Label>
              <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@devega.com" required className="pl-10" /></div>
            </div>
            <div><Label className="text-xs font-semibold mb-1.5 block">Contraseña</Label>
              <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="pl-10 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <Button type="submit" disabled={loading || !email || !password} className="w-full gap-2">
              {loading ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <><ArrowRight size={16} />Entrar</>}
              {loading && "Ingresando..."}
            </Button>
          </form>
          <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">
            De Vega &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
