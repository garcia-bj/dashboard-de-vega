"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wand2, CalendarCheck, ImageIcon, Share2, TrendingUp,
  CheckCircle2, Clock, AlertCircle, ArrowUpRight,
  Facebook, Instagram, Plus,
} from "lucide-react";

const metrics = [
  { label: "Imágenes", value: "847", change: "+12%", icon: Wand2, color: "bg-accent text-primary" },
  { label: "Publicados Hoy", value: "3", change: "2 pend.", icon: CalendarCheck, color: "bg-amber-100 text-amber-800" },
  { label: "Programados", value: "12", change: "semana", icon: Clock, color: "bg-muted text-foreground" },
  { label: "Alcance", value: "24.5K", change: "+8.3%", icon: TrendingUp, color: "bg-primary/10 text-primary" },
];

const platforms = [
  { name: "Facebook", icon: Facebook, status: "Conectado", pubs: 28, connected: true },
  { name: "Instagram", icon: Instagram, status: "Conectado", pubs: 42, connected: true },
  { name: "Stories", icon: Instagram, status: "Conectado", pubs: 15, connected: true },
];

const nextPublications = [
  { id: "1", title: "Viernes Promo", prompt: "Plato gourmet con neón", model: "Gemini", time: "Hoy 18:00", status: "scheduled", targets: ["fb", "ig"] },
  { id: "2", title: "Sábado Especial", prompt: "Cóctel artesanal tropical", model: "DALL·E 3", time: "Mañana 12:00", status: "generating", targets: ["story"] },
  { id: "3", title: "Domingo Relax", prompt: "Terraza atardecer cálido", model: "Flux", time: "Dom 10:00", status: "draft", targets: ["fb", "ig", "story"] },
];

const statusMap: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "default" | "destructive"; icon: typeof CheckCircle2 }> = {
  scheduled: { label: "Programada", variant: "default", icon: Clock },
  generating: { label: "Generando", variant: "warning", icon: Wand2 },
  published: { label: "Publicada", variant: "success", icon: CheckCircle2 },
  failed: { label: "Falló", variant: "destructive", icon: AlertCircle },
  draft: { label: "Borrador", variant: "ghost", icon: AlertCircle },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

export default function DashboardPage() {
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
            <p className="text-2xl md:text-4xl font-bold mt-1">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Pubs */}
        <motion.div variants={item} className="lg:col-span-2 rounded-md border bg-card p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Próximas Publicaciones</h3>
            <Link href="/schedule"><Button variant="ghost" size="sm">Ver todas</Button></Link>
          </div>
          <div className="space-y-3">
            {nextPublications.map((pub) => {
              const s = statusMap[pub.status];
              return (
                <div key={pub.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50 hover:bg-muted transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={20} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{pub.title}</h4>
                      <Badge variant={s.variant} className="gap-1">
                        <s.icon size={10} />{s.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-1.5">{pub.prompt}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Wand2 size={10} />{pub.model}</span>
                      <span className="flex items-center gap-1"><Clock size={10} />{pub.time}</span>
                      <span className="flex items-center gap-1"><Share2 size={10} />{pub.targets.length} redes</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Platforms */}
        <motion.div variants={item} className="rounded-md border bg-card p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Conexiones</h3>
          <div className="space-y-3">
            {platforms.map((p) => (
              <div key={p.name} className="p-3 rounded-md bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                    <p.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{p.name}</p>
                    <span className="text-xs text-muted-foreground">{p.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{p.pubs} publicaciones</span>
                  <Link href="/settings"><Button variant="link" size="sm" className="h-auto p-0">Gestionar</Button></Link>
                </div>
              </div>
            ))}
          </div>
          <Link href="/settings"><Button variant="outline" className="w-full mt-4 gap-2"><Plus size={16} /> Conectar cuenta</Button></Link>
        </motion.div>
      </div>
    </motion.div>
  );
}
