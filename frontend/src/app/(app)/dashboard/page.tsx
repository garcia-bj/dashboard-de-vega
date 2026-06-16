"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut, type SocialAccountOut } from "@/lib/api";
import {
  Wand2, CalendarCheck, ImageIcon, Share2,
  CheckCircle2, Clock, AlertCircle, Plus, Loader2, Facebook, Instagram, ArrowUpRight,
} from "lucide-react";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "default" | "destructive"; icon: typeof CheckCircle2 }> = {
  scheduled:  { label: "Programada",  variant: "default",     icon: Clock },
  pending:    { label: "Pendiente",   variant: "default",     icon: Clock },
  generating: { label: "Generando",   variant: "warning",     icon: Wand2 },
  generated:  { label: "Generada",    variant: "warning",     icon: CheckCircle2 },
  publishing: { label: "Publicando",  variant: "warning",     icon: Share2 },
  published:  { label: "Publicada",   variant: "success",     icon: CheckCircle2 },
  failed:     { label: "Falló",       variant: "destructive", icon: AlertCircle },
  draft:      { label: "Borrador",    variant: "ghost",       icon: AlertCircle },
};

const modelLabel: Record<string, string> = {
  gemini: "Gemini", openai_dalle: "DALL·E 3", openrouter_flux: "Flux", openrouter_stable_diffusion: "SDXL",
};

const providerIcon: Record<string, typeof Facebook> = { facebook: Facebook, instagram: Instagram };

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } } };

function formatScheduled(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return `Hoy ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString())
    return `Mañana ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token) || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const [pubs, setPubs] = useState<PublicationOut[]>([]);
  const [accounts, setAccounts] = useState<SocialAccountOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([api.publications.list(token), api.social.listAccounts(token)])
      .then(([p, a]) => { setPubs(p); setAccounts(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const now = new Date();
  const totalGenerated = pubs.filter((p) => ["generated", "published"].includes(p.status)).length;
  const publishedToday = pubs.filter((p) => p.published_at && new Date(p.published_at).toDateString() === now.toDateString()).length;
  const scheduledCount = pubs.filter((p) => ["scheduled", "pending"].includes(p.status)).length;
  const upcoming = pubs
    .filter((p) => !["published", "failed"].includes(p.status))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  const metrics = [
    { label: "Imágenes IA",      value: totalGenerated, sub: `${pubs.length} total`,    icon: Wand2,        from: "from-violet-500/20", border: "border-violet-500/20", iconColor: "text-violet-400" },
    { label: "Publicadas Hoy",   value: publishedToday,  sub: "publicaciones",           icon: CalendarCheck, from: "from-emerald-500/20", border: "border-emerald-500/20", iconColor: "text-emerald-400" },
    { label: "Programadas",      value: scheduledCount,  sub: "próximas",                icon: Clock,         from: "from-amber-500/20",   border: "border-amber-500/20",   iconColor: "text-amber-400" },
    { label: "Cuentas",          value: accounts.length, sub: "conectadas",              icon: Share2,        from: "from-primary/20",     border: "border-primary/20",     iconColor: "text-primary" },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div variants={item}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top left, hsl(342 62% 44% / 0.08), transparent 60%)" }} />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-1">
            Bienvenido a <span style={{ color: "hsl(var(--secondary))" }}>De Vega</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Genera imágenes con IA y publica automáticamente en tus redes sociales.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/generate">
              <button className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
                <Plus size={16} /> Nueva Publicación
              </button>
            </Link>
            <Link href="/schedule">
              <button className="h-9 px-4 rounded-xl text-sm font-semibold border border-border bg-muted text-foreground flex items-center gap-2 hover:bg-accent transition-colors">
                Ver Calendario
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <motion.div key={m.label} variants={item}
            className={`rounded-2xl border bg-card p-5 relative overflow-hidden group hover:border-opacity-60 transition-colors ${m.border}`}>
            <div className={`absolute top-0 left-0 w-full h-1/2 pointer-events-none bg-gradient-to-b ${m.from} to-transparent`} />
            <div className="relative z-10">
              <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center mb-3 ${m.iconColor}`}>
                <m.icon size={18} />
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{m.label}</p>
              {loading ? (
                <Loader2 size={18} className="animate-spin text-muted-foreground mt-1" />
              ) : (
                <div className="flex items-end gap-2">
                  <p className="text-3xl font-bold text-foreground">{m.value}</p>
                  <span className="text-xs text-muted-foreground mb-1 flex items-center gap-0.5">
                    <ArrowUpRight size={10} />{m.sub}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas publicaciones */}
        <motion.div variants={item} className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-foreground">Próximas Publicaciones</h3>
            <Link href="/schedule">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Ver todas →</span>
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 flex flex-col items-center gap-3 text-muted-foreground">
              <ImageIcon size={32} className="opacity-20" />
              <p className="text-sm">Sin publicaciones programadas</p>
              <Link href="/generate">
                <span className="text-xs text-primary hover:underline cursor-pointer">Crea tu primera imagen →</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((pub) => {
                const s = statusMap[pub.status] ?? statusMap.draft;
                return (
                  <div key={pub.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {pub.image_url
                        ? <img src={pub.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                        : <ImageIcon size={16} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-foreground truncate">{pub.title}</p>
                        <Badge variant={s.variant} className="gap-1 flex-shrink-0"><s.icon size={9} />{s.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Wand2 size={10} />{modelLabel[pub.ai_model] ?? pub.ai_model}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{formatScheduled(pub.scheduled_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Conexiones */}
        <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Conexiones</h3>
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-4">Sin cuentas conectadas</p>
          ) : (
            <div className="space-y-2 mb-4">
              {accounts.map((acc) => {
                const Icon = providerIcon[acc.provider] ?? Share2;
                return (
                  <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/60">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{acc.page_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{acc.provider}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/settings">
            <button className="w-full h-9 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-2">
              <Plus size={15} /> Conectar cuenta
            </button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
