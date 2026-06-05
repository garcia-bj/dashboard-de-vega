"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Plus, X, Sparkles, CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Edit3, Trash2, Save, Share2, Facebook, Instagram, ImageIcon,
  Clock, CheckCircle2, Palette, Download, MoreVertical,
} from "lucide-react";

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const weeks = ["22 Mar - 28 Mar", "29 Mar - 04 Abr", "05 Abr - 11 Abr"];

const library = [
  { id: "1", name: "Viernes Promo", color: "bg-amber-100" },
  { id: "2", name: "Sábado Especial", color: "bg-accent" },
  { id: "3", name: "Domingo Relax", color: "bg-muted" },
  { id: "4", name: "Oferta Flash", color: "bg-amber-100" },
  { id: "5", name: "Nuevo Plato", color: "bg-accent" },
  { id: "6", name: "Cóctel Día", color: "bg-muted" },
];

const history = [
  { id: "1", period: "Sem 22-28 Mar", style: "Dark Luxury", highlights: "Promo, Flash, Cóctel", status: "Publicado", platforms: ["fb", "ig"] },
  { id: "2", period: "Sem 15-21 Mar", style: "Warm Golden", highlights: "Nuevo, Especial", status: "Publicado", platforms: ["fb"] },
  { id: "3", period: "Sem 08-14 Mar", style: "Neon Night", highlights: "Domingo Relax", status: "Borrador", platforms: ["fb"] },
];

export default function SchedulePage() {
  const [week, setWeek] = useState(weeks[0]);
  const [weekOpen, setWeekOpen] = useState(false);
  const [styleDesc, setStyleDesc] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [statusOpen, setStatusOpen] = useState(false);
  const [slots, setSlots] = useState({
    feed: ["Foto Promocional", "Oferta del Día"],
    story: ["Historia del Día"],
    reel: [] as string[],
  });

  const removeSlot = (cat: keyof typeof slots, item: string) => {
    setSlots((p) => ({ ...p, [cat]: p[cat].filter((s) => s !== item) }));
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <h2 className="text-2xl font-semibold">Programar</h2>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Library */}
        <div className="lg:col-span-3 rounded-md border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Biblioteca</h3>
            <Link href="/media"><Button variant="link" size="sm">Ver todas</Button></Link>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
            {library.map((img) => (
              <div key={img.id} className="cursor-pointer group">
                <div className={cn(img.color, "aspect-square rounded-md flex items-center justify-center mb-1 group-hover:scale-[1.02] transition-transform")}>
                  <ImageIcon size={24} className="text-muted-foreground/50" />
                </div>
                <p className="text-xs font-medium truncate">{img.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Programmer */}
        <div className="lg:col-span-5 rounded-md border bg-card p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold">Programación</h3>
            <Button variant="ghost" size="sm" className="gap-1 text-secondary"><Sparkles size={14} />Autocompletar IA</Button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Selecciona contenido para cada día</p>

          <div className="flex gap-1 mb-3">
            {days.map((d) => <div key={d} className="flex-1 text-center py-1.5 rounded text-xs bg-muted text-muted-foreground">{d}</div>)}
          </div>

          <div className="relative mb-3">
            <label className="text-xs font-semibold mb-1 block">Semana</label>
            <button onClick={() => setWeekOpen(!weekOpen)} className="w-full h-10 rounded-md border px-3 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><CalendarDays size={14} className="text-muted-foreground" />{week}</span>
              <ChevronDown size={14} className={cn("transition-transform", weekOpen && "rotate-180")} />
            </button>
            {weekOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 rounded-md border bg-popover shadow-md z-20 overflow-hidden">
                {weeks.map((w) => <button key={w} onClick={() => { setWeek(w); setWeekOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent", w === week && "bg-accent font-medium")}>{w}</button>)}
              </div>
            )}
          </div>

          {[
            { key: "feed" as const, label: "Posts Feed", icon: Facebook },
            { key: "story" as const, label: "Stories", icon: Instagram },
            { key: "reel" as const, label: "Reels", icon: Share2 },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="mb-3">
              <label className="text-xs font-semibold mb-1 block">{label}</label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-md bg-muted/50 border">
                {slots[key].map((item) => (
                  <Badge key={item} variant="secondary" className="gap-1">
                    {item} <button onClick={() => removeSlot(key, item)}><X size={12} /></button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 text-primary"><Plus size={12} />Agregar</Button>
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
            <Button variant="ghost" size="sm" className="text-destructive gap-1"><Trash2 size={14} />Borrar</Button>
            <Button size="sm" className="gap-1 ml-auto"><Save size={14} />Programar Semana</Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-md border bg-card p-4">
            <h3 className="font-semibold flex items-center gap-2 mb-3"><Palette size={16} className="text-primary" />Estilo Visual</h3>
            <Textarea value={styleDesc} onChange={(e) => setStyleDesc(e.target.value)} rows={3} placeholder="Describe el estilo..." className="mb-2" />
            <div className="flex justify-between">
              <Button variant="outline" size="sm" className="gap-1"><Plus size={14} />Referencia</Button>
              <Button variant="ghost" size="sm" className="gap-1 text-secondary"><Sparkles size={14} />Generar IA</Button>
            </div>
          </div>

          <div className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Vista Previa</h3>
              <Badge variant="warning">IA DRAFT</Badge>
            </div>
            <div className="bg-sidebar rounded-md p-4 mb-3">
              <p className="text-sidebar-foreground font-bold mb-3">De Vega</p>
              <div className="space-y-2">
                <div><p className="text-sidebar-accent text-xs uppercase">Feed</p><p className="text-sidebar-foreground text-sm">Viernes Promo · Dark Luxury</p></div>
                <div><p className="text-sidebar-accent text-xs uppercase">Stories</p><p className="text-sidebar-foreground text-sm">Historia del Día</p></div>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <span className="w-7 h-7 rounded bg-[#1877F2]/10 flex items-center justify-center"><Facebook size={14} className="text-[#1877F2]" /></span>
              <span className="w-7 h-7 rounded bg-[#E4405F]/10 flex items-center justify-center"><Instagram size={14} className="text-[#E4405F]" /></span>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-1 mb-2"><Download size={14} />Descargar Preview</Button>
            <Button size="sm" className="w-full gap-1"><Share2 size={14} />Publicar Programación</Button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="rounded-md border bg-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="font-semibold">Historial de Publicaciones</h3>
          <div className="relative">
            <button onClick={() => setStatusOpen(!statusOpen)} className="h-9 rounded-md border px-3 flex items-center gap-2 text-sm">
              Estado: <span className="font-medium">{statusFilter}</span> <ChevronDown size={14} />
            </button>
            {statusOpen && (
              <div className="absolute top-full right-0 mt-1 rounded-md border bg-popover shadow-md z-20 overflow-hidden min-w-[140px]">
                {["Todos", "Publicado", "Programado", "Borrador"].map((s) => (
                  <button key={s} onClick={() => { setStatusFilter(s); setStatusOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent", s === statusFilter && "bg-accent font-medium")}>{s}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Periodo</th><th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Estilo</th><th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Contenido</th><th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Estado</th><th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground">Acciones</th></tr></thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="py-2.5 px-3 flex items-center gap-1.5"><CalendarDays size={14} className="text-muted-foreground" /><span className="font-medium">{row.period}</span></td>
                  <td className="py-2.5 px-3">{row.style}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{row.highlights}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant={row.status === "Publicado" ? "success" : "ghost"} className="gap-1">
                      {row.status === "Publicado" ? <CheckCircle2 size={10} /> : <Clock size={10} />}{row.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-7 w-7"><Eye size={14} /></Button><Button variant="ghost" size="icon" className="h-7 w-7"><Edit3 size={14} /></Button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>1-3 de 24</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled><ChevronLeft size={14} /></Button>
            <Button variant="default" size="icon" className="h-7 w-7 text-xs">1</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-xs">2</Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><ChevronRight size={14} /></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
