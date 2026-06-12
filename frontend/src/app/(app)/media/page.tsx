"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut } from "@/lib/api";
import {
  Plus, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Grid3X3, List,
  MoreVertical, Clock, CheckCircle2, Edit3, AlertCircle, Sparkles, Trash2, Eye, Loader2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "destructive" | "default"; icon: typeof CheckCircle2 }> = {
  published: { label: "Publicado", variant: "success", icon: CheckCircle2 },
  scheduled: { label: "Programado", variant: "default", icon: Clock },
  pending: { label: "Pendiente", variant: "default", icon: Clock },
  generating: { label: "Generando", variant: "warning", icon: Sparkles },
  generated: { label: "Generado", variant: "warning", icon: CheckCircle2 },
  draft: { label: "Borrador", variant: "ghost", icon: Edit3 },
  failed: { label: "Falló", variant: "destructive", icon: AlertCircle },
};

const modelLabel: Record<string, string> = {
  gemini: "Gemini",
  openai_dalle: "DALL·E 3",
  openrouter_flux: "Flux",
  openrouter_stable_diffusion: "SDXL",
};

const dateRanges = ["Últimos 7 días", "Últimos 30 días", "Últimos 90 días", "Todo"];
const statusFilters = ["Todos", "Publicado", "Programado", "Borrador"];

const STATUS_MAP: Record<string, string[]> = {
  "Publicado": ["published"],
  "Programado": ["scheduled", "pending"],
  "Borrador": ["draft", "generated", "generating"],
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return `Hoy ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

const PAGE_SIZE = 10;

export default function MediaPage() {
  const token = useAuthStore((s) => s.token) || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const [all, setAll] = useState<PublicationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [dateOpen, setDateOpen] = useState(false);
  const [dateRange, setDateRange] = useState(dateRanges[1]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [view, setView] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    api.publications.list(token).then(setAll).catch(() => toast.error("Error al cargar galería")).finally(() => setLoading(false));
  }, [token]);

  // Date filter
  const daysMap: Record<string, number> = { "Últimos 7 días": 7, "Últimos 30 días": 30, "Últimos 90 días": 90 };
  const filtered = all.filter((p) => {
    if (statusFilter !== "Todos") {
      const allowed = STATUS_MAP[statusFilter] ?? [];
      if (!allowed.includes(p.status)) return false;
    }
    if (daysMap[dateRange]) {
      const cutoff = Date.now() - daysMap[dateRange] * 86400000;
      if (new Date(p.created_at).getTime() < cutoff) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeleting(id);
    try {
      await api.publications.delete(id, token);
      setAll((prev) => prev.filter((p) => p.id !== id));
      toast.success("Publicación eliminada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    } finally { setDeleting(null); }
  };

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
                {dateRanges.map((r) => (
                  <button key={r} onClick={() => { setDateRange(r); setDateOpen(false); setPage(1); }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent", r === dateRange && "bg-accent font-medium")}>{r}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {statusFilters.map((s) => (
              <Badge key={s} variant={s === statusFilter ? "default" : "outline"} className="cursor-pointer" onClick={() => { setStatusFilter(s); setPage(1); }}>{s}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-1 p-0.5 rounded-md bg-muted">
          <Button variant={view === "grid" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("grid")}><Grid3X3 size={16} /></Button>
          <Button variant={view === "list" ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setView("list")}><List size={16} /></Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 size={28} className="animate-spin text-muted-foreground" /></div>
      ) : paginated.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 flex flex-col items-center gap-3 text-muted-foreground">
          <Sparkles size={36} className="opacity-30" />
          <p className="text-sm">Sin publicaciones{statusFilter !== "Todos" ? ` con estado "${statusFilter}"` : ""}</p>
          <Link href="/generate"><Button size="sm" className="gap-2"><Plus size={14} />Crear primera imagen</Button></Link>
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {paginated.map((item) => {
            const s = statusConfig[item.status] ?? statusConfig.draft;
            return (
              <div key={item.id} className="rounded-md border bg-card p-3 md:p-4 hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      : <Sparkles size={24} className="text-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={s.variant} className="gap-1"><s.icon size={10} />{s.label}</Badge>
                      <span className="text-xs font-bold uppercase">{item.title}</span>
                    </div>
                    <p className="text-sm font-medium mb-0.5">Generado con {modelLabel[item.ai_model] ?? item.ai_model}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">{item.prompt}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={10} />{formatDate(item.created_at)}</span>
                      {item.targets.length > 0 && <span>{item.targets.length} redes</span>}
                    </div>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.image_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(item.image_url!, "_blank")}><Eye size={14} /></Button>
                    )}
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical size={14} /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {paginated.map((item) => {
            const s = statusConfig[item.status] ?? statusConfig.draft;
            return (
              <div key={item.id} className="rounded-md border bg-card overflow-hidden hover:shadow-sm transition-shadow cursor-pointer group">
                <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    : <Sparkles size={32} className="text-muted-foreground/30" />}
                  <Badge variant={s.variant} className="absolute top-2 left-2 gap-1"><s.icon size={10} />{s.label}</Badge>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-background/80" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
                      {deleting === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} className="text-destructive" />}
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold uppercase mb-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={10} />{formatDate(item.created_at)}</span>
                    <span>{modelLabel[item.ai_model] ?? item.ai_model}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /></Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={n === page ? "default" : "ghost"} size="icon" className="h-7 w-7 text-xs" onClick={() => setPage(n)}>{n}</Button>
            ))}
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={14} /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
