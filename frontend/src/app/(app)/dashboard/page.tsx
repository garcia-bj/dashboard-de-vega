"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut, type SocialAccountOut } from "@/lib/api";
import {
  Wand2, CalendarCheck, ImageIcon, Share2,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight,
  Facebook, Instagram, Plus, Loader2,
} from "lucide-react";

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "default" | "destructive"; icon: typeof CheckCircle2 }> = {
  scheduled: { label: "Programada", variant: "default", icon: Clock },
  pending: { label: "Pendiente", variant: "default", icon: Clock },
  generating: { label: "Generando", variant: "warning", icon: Wand2 },
  generated: { label: "Generada", variant: "warning", icon: CheckCircle2 },
  publishing: { label: "Publicando", variant: "warning", icon: Share2 },
  published: { label: "Publicada", variant: "success", icon: CheckCircle2 },
  failed: { label: "Falló", variant: "destructive", icon: AlertCircle },
  draft: { label: "Borrador", variant: "ghost", icon: AlertCircle },
};

const modelLabel: Record<string, string> = {
  gemini: "Gemini",
  openai_dalle: "DALL·E 3",
  openrouter_flux: "Flux",
  openrouter_stable_diffusion: "SDXL",
};

const providerIcon: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function formatScheduled(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  if (Math.abs(diff) < 86400000 && d.toDateString() === now.toDateString()) {
    return `Hoy ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) {
    return `Mañana ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DashboardPage() {
  const token = useAuthStore((s) => s.token) || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const [pubs, setPubs] = useState<PublicationOut[]>([]);
  const [accounts, setAccounts] = useState<SocialAccountOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.publications.list(token),
      api.social.listAccounts(token),
    ]).then(([p, a]) => {
      setPubs(p);
      setAccounts(a);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const now = new Date();
  const todayStr = now.toDateString();

  const totalGenerated = pubs.filter((p) => ["generated", "published"].includes(p.status)).length;
  const publishedToday = pubs.filter((p) => p.published_at && new Date(p.published_at).toDateString() === todayStr).length;
  const scheduledCount = pubs.filter((p) => ["scheduled", "pending"].includes(p.status)).length;

  const upcoming = pubs
    .filter((p) => !["published", "failed"].includes(p.status))
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 4);

  const metrics = [
    { label: "Imágenes", value: String(totalGenerated), change: `${pubs.length} total`, icon: Wand2, color: "bg-accent text-primary" },
    { label: "Publicados Hoy", value: String(publishedToday), change: `${scheduledCount} pend.`, icon: CalendarCheck, color: "bg-amber-100 text-amber-800" },
    { label: "Programados", value: String(scheduledCount), change: "próximos", icon: Clock, color: "bg-muted text-foreground" },
    { label: "Cuentas", value: String(accounts.length), change: "conectadas", icon: Share2, color: "bg-primary/10 text-primary" },
  ];

  return (
    <motion.div initial="hidden" animate="show" variants={container} className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <motion.div variants={item} className="rounded-md border bg-card p-6 md:p-8 bg-gradient-to-br from-card to-muted/30">
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-2">De Vega</h1>
        <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
          Genera imágenes con IA y publica automáticamente en tus redes sociales.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link href="/generate"><Button className="gap-2"><Plus size={18} /> Nueva Publicación</Button></Link>
          <Link href="/schedule"><Button variant="outline">Ver Calendario</Button></Link>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {metrics.map((metric) => (
          <motion.div key={metric.label} variants={item} whileHover={{ y: -2 }} className="rounded-md border bg-card p-4 md:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 md:p-3 rounded-md ${metric.color}`}><metric.icon size={20} /></div>
              <span className="text-xs text-secondary flex items-center gap-1"><ArrowUpRight size={12} />{metric.change}</span>
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{metric.label}</p>
            {loading ? (
              <Loader2 size={20} className="animate-spin mt-2 text-muted-foreground" />
            ) : (
              <p className="text-2xl md:text-4xl font-bold mt-1">{metric.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Próximas Pubs */}
        <motion.div variants={item} className="lg:col-span-2 rounded-md border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Próximas Publicaciones</h3>
            <Link href="/schedule"><Button variant="ghost" size="sm">Ver todas</Button></Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
          ) : upcoming.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-md bg-muted/50 text-sm text-muted-foreground">
              <ImageIcon size={18} /> Sin publicaciones — <Link href="/generate" className="text-primary underline">crea una</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((pub) => {
                const s = statusMap[pub.status] ?? statusMap.draft;
                return (
                  <div key={pub.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                    <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {pub.image_url
                        ? <img src={pub.image_url} alt="" className="w-full h-full object-cover" />
                        : <ImageIcon size={20} className="text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold">{pub.title}</h4>
                        <Badge variant={s.variant} className="gap-1"><s.icon size={10} />{s.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-1.5">{pub.prompt}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Wand2 size={10} />{modelLabel[pub.ai_model] ?? pub.ai_model}</span>
                        <span className="flex items-center gap-1"><Clock size={10} />{formatScheduled(pub.scheduled_at)}</span>
                        <span className="flex items-center gap-1"><Share2 size={10} />{pub.targets.length} redes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Conexiones */}
        <motion.div variants={item} className="rounded-md border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Conexiones</h3>
          {loading ? (
            <div className="flex items-center justify-center h-24"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground mb-4">Sin cuentas conectadas</p>
          ) : (
            <div className="space-y-3 mb-4">
              {accounts.map((acc) => {
                const Icon = providerIcon[acc.provider] ?? Share2;
                return (
                  <div key={acc.id} className="p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                        <Icon size={18} className="text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{acc.page_name}</p>
                        <span className="text-xs text-muted-foreground capitalize">{acc.provider}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <Link href="/settings">
            <Button variant="outline" className="w-full gap-2"><Plus size={16} /> Conectar cuenta</Button>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
