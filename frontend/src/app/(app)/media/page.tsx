"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Plus, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Grid3X3, List,
  MoreVertical, Clock, CheckCircle2, Edit3, AlertCircle, Sparkles, Trash2, Eye,
} from "lucide-react";

const items = [
  { id: "1", title: "Viernes Promo", desc: "Plato gourmet con luces de neón y ambiente festivo cinematográfico", model: "Gemini", status: "published" as const, date: "Hoy 18:00", platforms: 2 },
  { id: "2", title: "Sábado Especial", desc: "Cóctel artesanal con frutas tropicales sobre fondo oscuro", model: "DALL·E 3", status: "scheduled" as const, date: "Mañana 08:00", platforms: 1 },
  { id: "3", title: "Sin categoría", desc: "Pasta artesanal con hongos silvestres y trufa blanca", model: "Flux", status: "draft" as const, date: "Hace 2h", platforms: 0 },
  { id: "4", title: "Especial Día", desc: "Taco de ribeye con salsa aguacate, iluminación natural", model: "SDXL", status: "published" as const, date: "22 May", platforms: 2 },
  { id: "5", title: "Menú Saludable", desc: "Bowl de quinua orgánica, vegetales asados y palta", model: "Gemini", status: "published" as const, date: "21 May", platforms: 1 },
];

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "destructive" | "default"; icon: typeof CheckCircle2 }> = {
  published: { label: "Publicado", variant: "success", icon: CheckCircle2 },
  scheduled: { label: "Programado", variant: "default", icon: Clock },
  draft: { label: "Borrador", variant: "ghost", icon: Edit3 },
  failed: { label: "Falló", variant: "destructive", icon: AlertCircle },
};

const dateRanges = ["Últimos 7 días", "Últimos 30 días", "Últimos 90 días", "Todo"];
const statuses = ["Todos", "Publicado", "Programado", "Borrador"];

export default function MediaPage() {
  const [dateOpen, setDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState(dateRanges[1]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [view, setView] = useState<"grid" | "list">("list");

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div><h2 className="text-2xl font-semibold">Galería</h2><p className="text-sm text-muted-foreground">Imágenes generadas y publicaciones</p></div>
        <Link href="/generate"><Button className="gap-2"><Plus size={16} />Nueva Publicación</Button></Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button onClick={() => setDateOpen(!dateOpen)} className="h-9 rounded-md border px-3 flex items-center gap-2 text-sm">
              <CalendarDays size={14} className="text-muted-foreground" />{dateRange}<ChevronDown size={14} />
            </button>
            {dateOpen && (
              <div className="absolute top-full left-0 mt-1 rounded-md border bg-popover shadow-md z-20 overflow-hidden min-w-[180px]">
                {dateRanges.map((r) => <button key={r} onClick={() => { setDateRange(r); setDateOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent", r === dateRange && "bg-accent font-medium")}>{r}</button>)}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {statuses.map((s) => (
              <Badge key={s} variant={s === statusFilter ? "default" : "outline"} className="cursor-pointer" onClick={() => setStatusFilter(s)}>{s}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-1 p-0.5 rounded-md bg-muted">
          <Button variant={view === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}><Grid3X3 size={16} /></Button>
          <Button variant={view === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}><List size={16} /></Button>
        </div>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="space-y-2">
          {items.map((item) => {
            const s = statusConfig[item.status];
            return (
              <div key={item.id} className="rounded-md border bg-card p-3 md:p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0"><Sparkles size={24} className="text-muted-foreground/30" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={s.variant} className="gap-1"><s.icon size={10} />{s.label}</Badge>
                      <span className="text-xs font-bold uppercase">{item.title}</span>
                    </div>
                    <p className="text-sm font-medium mb-0.5">Generado con {item.model}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{item.desc}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={10} />{item.date}</span>
                      {item.platforms > 0 && <span>{item.platforms} redes</span>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Eye size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit3 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 size={14} /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={14} /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => {
            const s = statusConfig[item.status];
            return (
              <div key={item.id} className="rounded-md border bg-card overflow-hidden hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="aspect-square bg-muted flex items-center justify-center relative">
                  <Sparkles size={32} className="text-muted-foreground/30" />
                  <Badge variant={s.variant} className="absolute top-2 left-2 gap-1"><s.icon size={10} />{s.label}</Badge>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold uppercase mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.desc}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={10} />{item.date}</span>
                    <span>{item.model}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New item link */}
      <div className="rounded-md border border-dashed p-4 flex items-center justify-center gap-3 hover:border-primary/30 cursor-pointer group">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Plus size={16} />
        </div>
        <p className="text-sm font-medium group-hover:text-primary transition-colors">Crear Nueva Publicación</p>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>1-5 de 24</span>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled><ChevronLeft size={14} /></Button>
          <Button variant="default" size="icon" className="h-7 w-7 text-xs">1</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-xs">2</Button>
          <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight size={14} /></Button>
        </div>
      </div>
    </div>
  );
}
