"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut } from "@/lib/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  Plus, CalendarDays, ChevronLeft, ChevronRight, Grid3X3, List,
  MoreVertical, Clock, CheckCircle2, Edit3, AlertCircle, Sparkles, Trash2, Eye, Loader2,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "destructive" | "default"; icon: typeof CheckCircle2 }> = {
  published:  { label: "Publicado",  variant: "success",     icon: CheckCircle2 },
  scheduled:  { label: "Programado", variant: "default",     icon: Clock },
  pending:    { label: "Pendiente",  variant: "default",     icon: Clock },
  generating: { label: "Generando",  variant: "warning",     icon: Sparkles },
  generated:  { label: "Generado",   variant: "warning",     icon: CheckCircle2 },
  draft:      { label: "Borrador",   variant: "ghost",       icon: Edit3 },
  failed:     { label: "Falló",      variant: "destructive", icon: AlertCircle },
};

const modelLabel: Record<string, string> = {
  gemini: "Gemini", openai_dalle: "DALL·E 3", openrouter_flux: "Flux", openrouter_stable_diffusion: "SDXL",
};

const dateRanges  = ["Últimos 7 días", "Últimos 30 días", "Últimos 90 días", "Todo"];
const statusFilters = ["Todos", "Publicado", "Programado", "Borrador"];
const STATUS_MAP: Record<string, string[]> = {
  "Publicado": ["published"], "Programado": ["scheduled", "pending"], "Borrador": ["draft", "generated", "generating"],
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return `Hoy ${d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString("es", { day: "numeric", month: "short" });
}

const PAGE_SIZE = 10;

export default function MediaPage() {
  const token = useAuthStore((s) => s.token) || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const [all, setAll] = useState<PublicationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(dateRanges[1]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [view, setView] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    api.publications.list(token).then(setAll).catch(() => toast.error("Error al cargar galería")).finally(() => setLoading(false));
  }, [token]);

  const daysMap: Record<string, number> = { "Últimos 7 días": 7, "Últimos 30 días": 30, "Últimos 90 días": 90 };
  const filtered = all.filter((p) => {
    if (statusFilter !== "Todos") {
      const allowed = STATUS_MAP[statusFilter] ?? [];
      if (!allowed.includes(p.status)) return false;
    }
    if (daysMap[dateRange]) {
      if (new Date(p.created_at).getTime() < Date.now() - daysMap[dateRange] * 86400000) return false;
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
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
    finally { setDeleting(null); }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Galería</h2>
          <p className="text-xs text-muted-foreground">Imágenes generadas y publicaciones</p>
        </div>
        <Link href="/generate">
          <button className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
            <Plus size={15} /> Nueva Publicación
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={dateRange} onValueChange={(v) => { setDateRange(v); setPage(1); }}>
            <SelectTrigger className="h-9 w-auto gap-2 bg-card border-border rounded-xl text-sm px-3">
              <CalendarDays size={13} className="text-muted-foreground" />
              <span>{dateRange}</span>
            </SelectTrigger>
            <SelectContent>
              {dateRanges.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1.5">
            {statusFilters.map((s) => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-medium border transition-all",
                  s === statusFilter
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                )}>{s}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-muted border border-border">
          {[{ v: "grid" as const, I: Grid3X3 }, { v: "list" as const, I: List }].map(({ v, I }) => (
            <button key={v} onClick={() => setView(v)}
              className={cn("p-1.5 rounded-lg transition-all", view === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <I size={15} />
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : paginated.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-14 flex flex-col items-center gap-3 text-muted-foreground">
          <Sparkles size={32} className="opacity-20" />
          <p className="text-sm">Sin publicaciones{statusFilter !== "Todos" ? ` con estado "${statusFilter}"` : ""}</p>
          <Link href="/generate">
            <button className="h-8 px-3 rounded-xl text-xs font-medium text-white flex items-center gap-1.5"
              style={{ background: "hsl(var(--primary))" }}>
              <Plus size={13} /> Crear primera imagen
            </button>
          </Link>
        </div>
      ) : view === "list" ? (
        <div className="space-y-2">
          {paginated.map((item) => {
            const s = statusConfig[item.status] ?? statusConfig.draft;
            return (
              <div key={item.id}
                className="rounded-2xl border border-border bg-card p-3 md:p-4 hover:border-primary/20 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.image_url
                      ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      : <Sparkles size={20} className="text-muted-foreground/30" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <Badge variant={s.variant} className="gap-1"><s.icon size={9} />{s.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-0.5">{modelLabel[item.ai_model] ?? item.ai_model}</p>
                    <p className="text-xs text-muted-foreground/70 line-clamp-1">{item.prompt}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Clock size={10} />{formatDate(item.created_at)}</span>
                      {item.targets.length > 0 && <span>{item.targets.length} redes</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.image_url && (
                      <button onClick={() => window.open(item.image_url!, "_blank")}
                        className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <Eye size={14} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                    <button className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <MoreVertical size={14} />
                    </button>
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
              <div key={item.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-all cursor-pointer group">
                <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                  {item.image_url
                    ? <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
                    : <Sparkles size={28} className="text-muted-foreground/20" />}
                  <Badge variant={s.variant} className="absolute top-2.5 left-2.5 gap-1 shadow-lg">
                    <s.icon size={9} />{s.label}
                  </Badge>
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                      {deleting === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground mb-1 truncate">{item.title}</p>
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
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button key={n} onClick={() => setPage(n)}
                className={cn("w-7 h-7 rounded-lg text-xs transition-colors",
                  n === page ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground")}>
                {n}
              </button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
