"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut, type SocialAccountOut } from "@/lib/api";
import {
  Wand2, CalendarCheck, ImageIcon, Share2,
  CheckCircle2, Clock, AlertCircle, Plus, Loader2, Facebook, Instagram,
  ArrowUpRight, TrendingUp, ExternalLink, CalendarDays, Percent, Video, Pencil,
} from "lucide-react";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "default" | "destructive"; icon: typeof CheckCircle2 }> = {
  scheduled:  { label: "Programada",  variant: "default",     icon: Clock },
  pending:    { label: "Pendiente",   variant: "default",     icon: Clock },
  generating: { label: "Generando",   variant: "warning",     icon: Wand2 },
  generated:  { label: "Lista",       variant: "warning",     icon: CheckCircle2 },
  publishing: { label: "Publicando",  variant: "warning",     icon: Share2 },
  published:  { label: "Publicada",   variant: "success",     icon: CheckCircle2 },
  failed:     { label: "Falló",       variant: "destructive", icon: AlertCircle },
  draft:      { label: "Borrador",    variant: "ghost",       icon: AlertCircle },
};

const providerIcon: Record<string, typeof Facebook> = { facebook: Facebook, instagram: Instagram };

const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item: Variants = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } } };

const DAY_LABELS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

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

  // ── Metrics ──
  const totalGenerated   = pubs.filter((p) => ["generated", "published", "scheduled"].includes(p.status)).length;
  const publishedToday   = pubs.filter((p) => p.published_at && new Date(p.published_at).toDateString() === now.toDateString()).length;
  const scheduledCount   = pubs.filter((p) => ["scheduled", "pending"].includes(p.status)).length;
  const publishedTotal   = pubs.filter((p) => p.status === "published").length;
  const failedTotal      = pubs.filter((p) => p.status === "failed").length;
  const successRate      = publishedTotal + failedTotal > 0
    ? Math.round((publishedTotal / (publishedTotal + failedTotal)) * 100)
    : 100;

  const upcoming = pubs
    .filter((p) => !["published", "failed"].includes(p.status))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 6);

  const recentPublished = pubs
    .filter((p) => p.status === "published" && p.published_at)
    .sort((a, b) => new Date(b.published_at!).getTime() - new Date(a.published_at!).getTime())
    .slice(0, 4);

  // ── 7-day activity chart ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - 6 + i);
    return d;
  });
  const dayValues = last7.map((d) =>
    pubs.filter((p) => p.published_at && new Date(p.published_at).toDateString() === d.toDateString()).length
  );
  const maxVal = Math.max(1, ...dayValues);

  const metrics = [
    { label: "Total Creadas",    value: totalGenerated,  sub: `${pubs.length} en sistema`, icon: Wand2,        from: "from-violet-500/15", border: "border-violet-500/20", iconColor: "text-violet-400" },
    { label: "Publicadas Hoy",   value: publishedToday,  sub: "publicaciones",              icon: CalendarCheck, from: "from-emerald-500/15", border: "border-emerald-500/20", iconColor: "text-emerald-400" },
    { label: "Programadas",      value: scheduledCount,  sub: "próximas",                   icon: Clock,         from: "from-blue-500/15",    border: "border-blue-500/20",    iconColor: "text-blue-400" },
    { label: "Tasa de Éxito",    value: `${successRate}%`, sub: `${publishedTotal} exitosas`, icon: Percent,     from: "from-primary/15",     border: "border-primary/20",     iconColor: "text-primary" },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div variants={item}
        className="rounded-2xl border border-border bg-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top left, hsl(342 62% 44% / 0.08), transparent 60%)" }} />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-1">
            Bienvenido a <span style={{ color: "hsl(var(--secondary))" }}>De Vega</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Genera imágenes y videos con IA y publica automáticamente en tus redes sociales.
          </p>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-5">
            <Link href="/generate" className="contents">
              <button className="h-10 sm:h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 col-span-2 sm:col-auto"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
                <Plus size={16} /> Nueva Publicación
              </button>
            </Link>
            <Link href="/video" className="contents">
              <button className="h-10 sm:h-9 px-4 rounded-xl text-sm font-semibold border border-border bg-muted text-foreground flex items-center justify-center gap-2 hover:bg-accent transition-colors">
                <Video size={15} /> Editar Video
              </button>
            </Link>
            <Link href="/calendar" className="contents">
              <button className="h-10 sm:h-9 px-4 rounded-xl text-sm font-semibold border border-border bg-muted text-foreground flex items-center justify-center gap-2 hover:bg-accent transition-colors">
                <CalendarDays size={15} /> Calendario
              </button>
            </Link>
            <Link href="/schedule" className="contents">
              <button className="h-10 sm:h-9 px-4 rounded-xl text-sm font-semibold border border-border bg-muted text-foreground flex items-center justify-center gap-2 hover:bg-accent transition-colors col-span-2 sm:col-auto">
                <Clock size={15} /> Programar
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <motion.div key={m.label} variants={item}
            className={`rounded-2xl border bg-card p-5 relative overflow-hidden ${m.border}`}>
            <div className={`absolute top-0 left-0 w-full h-1/2 pointer-events-none bg-gradient-to-b ${m.from} to-transparent`} />
            <div className="relative z-10">
              <div className={`w-9 h-9 rounded-xl bg-muted flex items-center justify-center mb-3 ${m.iconColor}`}>
                <m.icon size={18} />
              </div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 truncate">{m.label}</p>
              {loading ? (
                <Loader2 size={18} className="animate-spin text-muted-foreground mt-1" />
              ) : (
                <div className="flex items-end gap-1.5 flex-wrap">
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{m.value}</p>
                  <span className="text-xs text-muted-foreground mb-0.5 flex items-center gap-0.5">
                    <ArrowUpRight size={10} />{m.sub}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Middle row: activity chart + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming */}
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
                  <Link href="/schedule" key={pub.id}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 hover:bg-muted transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {pub.image_url
                          ? <img src={pub.image_url} alt="" className="w-full h-full object-cover rounded-xl" />
                          : <ImageIcon size={16} className="text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-foreground truncate">{pub.title}</p>
                          <Badge variant={s.variant} className="gap-1 flex-shrink-0 text-[10px]"><s.icon size={9} />{s.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock size={10} />{formatScheduled(pub.scheduled_at)}</span>
                          {pub.targets.slice(0, 2).map((t) => {
                            const Icon = t.includes("facebook") ? Facebook : Instagram;
                            return <Icon key={t} size={10} />;
                          })}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right column: activity + connections */}
        <div className="space-y-4">
          {/* 7-day activity */}
          <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Actividad (7 días)</h3>
              <TrendingUp size={14} className="text-muted-foreground" />
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="flex items-end gap-1.5 h-20">
                {last7.map((d, i) => {
                  const val = dayValues[i];
                  const heightPct = Math.max(4, Math.round((val / maxVal) * 100));
                  const isToday = d.toDateString() === now.toDateString();
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex flex-col justify-end" style={{ height: 56 }}>
                        <div
                          className={`w-full rounded-t-md transition-all ${isToday ? "bg-primary" : "bg-muted-foreground/25 hover:bg-muted-foreground/40"}`}
                          style={{ height: `${heightPct}%` }}
                          title={`${val} publicada${val !== 1 ? "s" : ""}`}
                        />
                      </div>
                      <span className={`text-[9px] font-medium ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                        {DAY_LABELS[d.getDay()]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {publishedTotal} publicadas en total
            </p>
          </motion.div>

          {/* Connections */}
          <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Conexiones</h3>
            {loading ? (
              <div className="flex items-center justify-center h-12">
                <Loader2 size={18} className="animate-spin text-muted-foreground" />
              </div>
            ) : accounts.length === 0 ? (
              <p className="text-xs text-muted-foreground mb-3">Sin cuentas conectadas</p>
            ) : (
              <div className="space-y-2 mb-3">
                {accounts.map((acc) => {
                  const Icon = providerIcon[acc.provider] ?? Share2;
                  return (
                    <div key={acc.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-muted/60">
                      <div className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{acc.page_name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{acc.provider}</p>
                      </div>
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Activa" />
                    </div>
                  );
                })}
              </div>
            )}
            <Link href="/settings">
              <button className="w-full h-8 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
                <Plus size={13} /> Conectar cuenta
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Recently published with links */}
      {recentPublished.length > 0 && (
        <motion.div variants={item} className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Publicadas Recientemente</h3>
            <Link href="/calendar">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Ver calendario →</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentPublished.map((pub) => {
              const results = pub.meta_data?.publish_results?.filter((r) => r.permalink) ?? [];
              return (
                <div key={pub.id} className="rounded-xl bg-muted/60 border border-border overflow-hidden group">
                  <div className="aspect-video bg-muted overflow-hidden">
                    {pub.image_url
                      ? <img src={pub.image_url} alt={pub.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} className="text-muted-foreground opacity-30" /></div>}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-semibold text-foreground truncate">{pub.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {pub.published_at ? new Date(pub.published_at).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                    {results.length > 0 && (
                      <div className="flex gap-2 mt-1.5">
                        {results.map((r) => (
                          <a key={r.target} href={r.permalink!} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[9px] text-primary hover:underline font-medium">
                            <ExternalLink size={8} />
                            {r.target.includes("instagram") ? "IG" : "FB"}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
