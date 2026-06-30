"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut, type VideoProjectOut } from "@/lib/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  Plus, CalendarDays, ChevronLeft, ChevronRight, Grid3X3, List,
  MoreVertical, Clock, CheckCircle2, Edit3, AlertCircle, Sparkles, Trash2, Eye, Loader2, Download,
  Film, ImageIcon,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

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
  gemini: "Gemini", openai: "IMAGE-2", openai_dalle: "IMAGE-2",
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
  const [videos, setVideos] = useState<VideoProjectOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(dateRanges[1]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [view, setView] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.publications.list(token),
      api.video.list(token).catch(() => [] as VideoProjectOut[]),
    ])
      .then(([pubs, vids]) => {
        setAll(pubs);
        setVideos(vids.filter((v) => v.status === "DONE" && v.edited_video_url));
      })
      .catch(() => toast.error("Error al cargar galería"))
      .finally(() => setLoading(false));
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

  const filteredVideos = videos
    .filter((v) => !daysMap[dateRange] || new Date(v.created_at).getTime() >= Date.now() - daysMap[dateRange] * 86400000)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  // Los filtros de estado son de publicaciones; mostramos videos solo en la vista "Todos".
  const showVideos = statusFilter === "Todos" && filteredVideos.length > 0;

  const handleDownload = async (url: string, title: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const ext = blob.type.includes("video") || blob.type.includes("mp4") ? "mp4"
        : blob.type.includes("png") ? "png" : "jpg";
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${title}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      toast.error("Error al descargar imagen");
    }
  };

  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

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

  const handleDeleteVideo = async (id: string) => {
    if (!token) return;
    setDeleting(id);
    try {
      await api.video.delete(id, token);
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success("Video eliminado");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error"); }
    finally { setDeleting(null); }
  };

  const handleDeleteAll = async () => {
    if (!token) return;
    setDeletingAll(true);
    try {
      await api.publications.deleteAll(token);
      setAll([]);
      setConfirmDeleteAll(false);
      toast.success("Galería vaciada correctamente");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error al vaciar"); }
    finally { setDeletingAll(false); }
  };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Galería</h2>
          <p className="text-xs text-muted-foreground">Imágenes y videos generados</p>
        </div>
        <div className="flex items-center gap-2">
          {all.length > 0 && (
            confirmDeleteAll ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">¿Vaciar toda la galería?</span>
                <button onClick={handleDeleteAll} disabled={deletingAll}
                  className="h-8 px-3 rounded-lg text-xs font-semibold bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  {deletingAll ? <><Loader2 size={12} className="animate-spin" />Borrando...</> : "Sí, borrar todo"}
                </button>
                <button onClick={() => setConfirmDeleteAll(false)}
                  className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDeleteAll(true)}
                className="h-9 px-3 rounded-xl border border-destructive/30 text-xs font-medium text-destructive/70 hover:text-destructive hover:border-destructive/60 hover:bg-destructive/5 transition-colors flex items-center gap-1.5">
                <Trash2 size={13} /> Vaciar galería
              </button>
            )
          )}
          <Link href="/generate">
            <button className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
              <Plus size={15} /> Nueva Publicación
            </button>
          </Link>
        </div>
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
          <div className="flex flex-wrap gap-1.5">
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

      {/* Sección Videos */}
      {showVideos && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Film size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Videos</h3>
            <span className="text-xs text-muted-foreground">({filteredVideos.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredVideos.map((v) => (
              <div key={v.id} className="rounded-2xl border border-border bg-card overflow-hidden group">
                <div className="bg-black flex items-center justify-center relative max-h-[240px] overflow-hidden">
                  <video src={toAbsoluteUrl(v.edited_video_url!)} controls className="w-full max-h-[240px] object-contain" />
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button onClick={() => handleDownload(toAbsoluteUrl(v.edited_video_url!), v.title)}
                      className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Descargar">
                      <Download size={12} />
                    </button>
                    <button onClick={() => handleDeleteVideo(v.id)} disabled={deleting === v.id}
                      className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                      {deleting === v.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs font-semibold text-foreground mb-1 truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{v.prompt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={10} />{formatDate(v.created_at)}</span>
                    <span className="flex items-center gap-1"><Film size={10} /> Video</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sección Imágenes */}
      {showVideos && (
        <div className="flex items-center gap-2">
          <ImageIcon size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Imágenes</h3>
        </div>
      )}
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
                  <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    {item.image_url && (
                      <>
                        <button onClick={() => window.open(item.image_url!, "_blank")}
                          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Ver">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleDownload(item.image_url!, item.title)}
                          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Descargar">
                          <Download size={14} />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleDelete(item.id)} disabled={deleting === item.id}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      {deleting === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
                  <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {item.image_url && (
                      <button onClick={() => handleDownload(item.image_url!, item.title)}
                        className="w-7 h-7 rounded-lg bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Descargar">
                        <Download size={12} />
                      </button>
                    )}
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
          <span className="flex-shrink-0">{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</span>
          <div className="flex gap-1 overflow-x-auto max-w-[60vw] pb-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0">
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => totalPages <= 7 || Math.abs(n - page) <= 2 || n === 1 || n === totalPages)
              .map((n, idx, arr) => (
                <>
                  {idx > 0 && arr[idx - 1] !== n - 1 && (
                    <span key={`ellipsis-${n}`} className="w-7 h-7 flex items-center justify-center text-muted-foreground/50">…</span>
                  )}
                  <button key={n} onClick={() => setPage(n)}
                    className={cn("w-7 h-7 rounded-lg text-xs transition-colors flex-shrink-0",
                      n === page ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground hover:text-foreground")}>
                    {n}
                  </button>
                </>
              ))}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
