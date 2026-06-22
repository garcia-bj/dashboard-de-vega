"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, Mail, Lock, ArrowRight, Loader2,
  Sparkles, Share2, CalendarCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

const features = [
  { icon: Sparkles,     title: "Generación IA",     desc: "Crea imágenes únicas con Gemini y DALL·E" },
  { icon: Share2,       title: "Auto-publicación",   desc: "Facebook, Instagram y Stories en un clic" },
  { icon: CalendarCheck,title: "Programación",       desc: "Calendarioza publicaciones automáticamente" },
];

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [focused, setFocused]           = useState<"email" | "password" | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.auth.login(email, password) as { access_token: string; user: unknown };
      setAuth(data.access_token, data.user as Parameters<typeof setAuth>[1]);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 xl:p-16 overflow-hidden"
        style={{ background: "hsl(var(--sidebar))" }}>

        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.18, 0.26, 0.18] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-1/4 -left-1/4 w-[70%] h-[70%] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(342 62% 44%), transparent 65%)" }}
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.12, 0.2, 0.12] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(25 95% 55%), transparent 65%)" }}
          />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }} />
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex items-center gap-3"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
            <img src="/logo.png" alt="De Vega" className="w-5 h-5 object-contain" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">De Vega</span>
        </motion.div>

        {/* Headline */}
        <div className="relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          >
            <h1 className="text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
              Crea.<br />
              Programa.<br />
              <span style={{ color: "hsl(var(--secondary))" }}>Publica.</span>
            </h1>
            <p className="text-sidebar-muted text-sm leading-relaxed mt-5 max-w-xs">
              Tu estudio de medios con IA. Genera contenido visual profesional y distribúyelo automáticamente en todas tus redes.
            </p>
          </motion.div>

          {/* Feature cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
            className="space-y-2.5"
          >
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.1, ease: "easeOut" }}
                className="flex items-center gap-3.5 px-4 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.08)" }}>
                  <f.icon size={15} className="text-white/70" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-white leading-tight">{f.title}</p>
                  <p className="text-[11px] text-sidebar-muted leading-tight mt-0.5">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="relative z-10 text-[11px] text-sidebar-muted"
        >
          &copy; {new Date().getFullYear()} De Vega — AI Media Studio
        </motion.p>
      </div>

      {/* ── Right panel — Form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle dot background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }} />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-[400px] relative z-10"
        >
          {/* Mobile logo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:hidden flex items-center gap-2.5 mb-10"
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
              <img src="/logo.png" alt="De Vega" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">De Vega</span>
          </motion.div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Bienvenido de vuelta</h2>
            <p className="text-sm text-muted-foreground mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/25 text-destructive text-sm px-4 py-3 rounded-xl"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive flex-shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-2 tracking-wide uppercase">
                Correo electrónico
              </label>
              <motion.div
                animate={{ scale: focused === "email" ? 1.005 : 1 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <Mail size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === "email" ? "text-primary" : "text-muted-foreground"}`} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200"
                  style={{
                    borderColor: focused === "email" ? "hsl(var(--primary))" : "hsl(var(--border))",
                    boxShadow: focused === "email" ? "0 0 0 3px hsl(var(--primary) / 0.12)" : "none",
                  }}
                />
              </motion.div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-foreground/70 mb-2 tracking-wide uppercase">
                Contraseña
              </label>
              <motion.div
                animate={{ scale: focused === "password" ? 1.005 : 1 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <Lock size={15} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200 ${focused === "password" ? "text-primary" : "text-muted-foreground"}`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  required
                  className="w-full h-12 pl-11 pr-12 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all duration-200"
                  style={{
                    borderColor: focused === "password" ? "hsl(var(--primary))" : "hsl(var(--border))",
                    boxShadow: focused === "password" ? "0 0 0 3px hsl(var(--primary) / 0.12)" : "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </motion.div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading || !email || !password}
              whileHover={!loading && email && password ? { scale: 1.015 } : {}}
              whileTap={!loading && email && password ? { scale: 0.985 } : {}}
              className="w-full h-12 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2.5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed mt-2 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
            >
              {/* Shimmer on hover */}
              <span className="absolute inset-0 translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Ingresando...</>
              ) : (
                <><span>Entrar</span><ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] text-muted-foreground font-medium">DE VEGA</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Tech badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {["Gemini", "DALL·E", "Facebook", "Instagram"].map((t) => (
              <span key={t}
                className="h-6 px-2.5 rounded-full text-[10px] font-medium text-muted-foreground border border-border bg-muted/50">
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
