"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  Plus, X, Sparkles, CalendarDays, ChevronLeft, ChevronRight,
  Eye, Edit3, Trash2, Save, Share2, Facebook, Instagram, ImageIcon,
  Clock, CheckCircle2, Palette, Download, MoreVertical,
} from "lucide-react";

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const weeks = ["22 Mar - 28 Mar", "29 Mar - 04 Abr", "05 Abr - 11 Abr"];

const library = [
  { id: "1", name: "Viernes Promo",   bg: "from-amber-500/20  to-amber-500/5"  },
  { id: "2", name: "Sábado Especial", bg: "from-primary/20    to-primary/5"    },
  { id: "3", name: "Domingo Relax",   bg: "from-muted         to-muted/50"     },
  { id: "4", name: "Oferta Flash",    bg: "from-amber-500/20  to-amber-500/5"  },
  { id: "5", name: "Nuevo Plato",     bg: "from-primary/20    to-primary/5"    },
  { id: "6", name: "Cóctel Día",      bg: "from-muted         to-muted/50"     },
];

const history = [
  { id: "1", period: "Sem 22-28 Mar", style: "Dark Luxury",  highlights: "Promo, Flash, Cóctel", status: "Publicado",  platforms: ["fb", "ig"] },
  { id: "2", period: "Sem 15-21 Mar", style: "Warm Golden",  highlights: "Nuevo, Especial",      status: "Publicado",  platforms: ["fb"] },
  { id: "3", period: "Sem 08-14 Mar", style: "Neon Night",   highlights: "Domingo Relax",        status: "Borrador",   platforms: ["fb"] },
];

export default function SchedulePage() {
  const [week, setWeek] = useState(weeks[0]);
  const [styleDesc, setStyleDesc] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [slots, setSlots] = useState({
    feed:  ["Foto Promocional", "Oferta del Día"],
    story: ["Historia del Día"],
    reel:  [] as string[],
  });

  const removeSlot = (cat: keyof typeof slots, item: string) =>
    setSlots((p) => ({ ...p, [cat]: p[cat].filter((s) => s !== item) }));

  const card = "rounded-2xl border border-border bg-card p-4 md:p-5";

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Programar</h2>
        <p className="text-xs text-muted-foreground">Planifica tu contenido semanal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Biblioteca */}
        <div className={cn(card, "lg:col-span-3")}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Biblioteca</h3>
            <Link href="/media">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Ver todas →</span>
            </Link>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
            {library.map((img) => (
              <div key={img.id} className="cursor-pointer group">
                <div className={cn("aspect-square rounded-xl bg-gradient-to-br flex items-center justify-center mb-1.5 border border-border group-hover:border-primary/30 transition-colors", img.bg)}>
                  <ImageIcon size={20} className="text-muted-foreground/40" />
                </div>
                <p className="text-xs font-medium text-foreground truncate">{img.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Programación */}
        <div className={cn(card, "lg:col-span-5")}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-foreground">Programación</h3>
            <button className="h-7 px-2.5 rounded-lg text-xs font-medium border border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors flex items-center gap-1">
              <Sparkles size={11} /> Autocompletar IA
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Selecciona contenido para cada día</p>

          <div className="flex gap-1 mb-3">
            {days.map((d) => (
              <div key={d} className="flex-1 text-center py-1.5 rounded-lg text-xs bg-muted text-muted-foreground font-medium">{d}</div>
            ))}
          </div>

          <div className="mb-3">
            <label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Semana</label>
            <Select value={week} onValueChange={setWeek}>
              <SelectTrigger className="bg-muted border-border rounded-xl h-10">
                <div className="flex items-center gap-2">
                  <CalendarDays size={13} className="text-muted-foreground" />
                  <span className="text-sm">{week}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {weeks.map((w) => <SelectItem key={w} value={w}>{w}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {[
            { key: "feed"  as const, label: "Posts Feed", icon: Facebook },
            { key: "story" as const, label: "Stories",    icon: Instagram },
            { key: "reel"  as const, label: "Reels",      icon: Share2 },
          ].map(({ key, label, icon: Icon }) => (
            <div key={key} className="mb-3">
              <label className="text-xs font-semibold text-foreground/70 mb-1.5 flex items-center gap-1.5 block">
                <Icon size={11} className="text-muted-foreground" />{label}
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl bg-muted/60 border border-border">
                {slots[key].map((item) => (
                  <span key={item}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-card border border-border text-xs text-foreground">
                    {item}
                    <button onClick={() => removeSlot(key, item)} className="text-muted-foreground hover:text-destructive transition-colors ml-0.5">
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <button className="h-6 px-2 text-xs text-primary hover:bg-primary/10 rounded-full transition-colors flex items-center gap-1">
                  <Plus size={11} /> Agregar
                </button>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
            <button className="h-8 px-3 rounded-xl text-xs font-medium border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5">
              <Trash2 size={13} /> Borrar
            </button>
            <button className="h-8 px-3 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 ml-auto"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
              <Save size={13} /> Programar Semana
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className={card}>
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground mb-3">
              <Palette size={15} className="text-primary" /> Estilo Visual
            </h3>
            <Textarea
              value={styleDesc}
              onChange={(e) => setStyleDesc(e.target.value)}
              rows={3}
              placeholder="Describe el estilo visual..."
              className="bg-muted border-border rounded-xl text-sm mb-2 resize-none"
            />
            <div className="flex justify-between">
              <button className="h-8 px-3 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5">
                <Plus size={13} /> Referencia
              </button>
              <button className="h-8 px-3 rounded-xl border border-secondary/20 text-secondary hover:bg-secondary/10 transition-colors text-xs flex items-center gap-1.5">
                <Sparkles size={13} /> Generar IA
              </button>
            </div>
          </div>

          <div className={card}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Vista Previa</h3>
              <Badge variant="warning">IA DRAFT</Badge>
            </div>
            <div className="rounded-xl border border-border p-4 mb-3"
              style={{ background: "hsl(var(--sidebar))" }}>
              <p className="text-white font-bold mb-3 text-sm">De Vega</p>
              <div className="space-y-2">
                <div>
                  <p className="text-secondary text-xs uppercase font-semibold mb-0.5">Feed</p>
                  <p className="text-white/80 text-xs">Viernes Promo · Dark Luxury</p>
                </div>
                <div>
                  <p className="text-secondary text-xs uppercase font-semibold mb-0.5">Stories</p>
                  <p className="text-white/80 text-xs">Historia del Día</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-[#1877F2]/10 border border-[#1877F2]/20 flex items-center justify-center">
                <Facebook size={13} className="text-[#1877F2]" />
              </span>
              <span className="w-7 h-7 rounded-lg bg-[#E4405F]/10 border border-[#E4405F]/20 flex items-center justify-center">
                <Instagram size={13} className="text-[#E4405F]" />
              </span>
            </div>
            <button className="w-full h-8 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5 mb-2">
              <Download size={13} /> Descargar Preview
            </button>
            <button className="w-full h-9 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
              <Share2 size={13} /> Publicar Programación
            </button>
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className={card}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Historial de Publicaciones</h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-auto bg-muted border-border rounded-xl text-sm px-3">
              <span className="text-muted-foreground mr-1">Estado:</span>
              <span className="font-medium text-foreground">{statusFilter}</span>
            </SelectTrigger>
            <SelectContent>
              {["Todos", "Publicado", "Programado", "Borrador"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Periodo", "Estilo", "Contenido", "Estado", ""].map((h, i) => (
                  <th key={i} className={cn("py-2.5 px-3 text-xs font-semibold text-muted-foreground", i === 4 ? "text-right" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                      <CalendarDays size={13} className="text-muted-foreground" />{row.period}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-foreground">{row.style}</td>
                  <td className="py-3 px-3 text-muted-foreground">{row.highlights}</td>
                  <td className="py-3 px-3">
                    <Badge variant={row.status === "Publicado" ? "success" : "ghost"} className="gap-1">
                      {row.status === "Publicado" ? <CheckCircle2 size={9} /> : <Clock size={9} />}{row.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Eye size={13} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>1–3 de 24</span>
          <div className="flex gap-1">
            <button disabled className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors">
              <ChevronLeft size={14} />
            </button>
            {[1, 2].map((n) => (
              <button key={n} className={cn("w-7 h-7 rounded-lg text-xs transition-colors",
                n === 1 ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground")}>
                {n}
              </button>
            ))}
            <button className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
