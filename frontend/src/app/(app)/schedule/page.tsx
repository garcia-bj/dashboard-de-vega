"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut } from "@/lib/api";
import {
  X, CalendarDays, ChevronLeft, ChevronRight,
  Eye, Save, Share2, Facebook, Instagram, ImageIcon,
  Clock, CheckCircle2, Hash, AlignLeft, Loader2, AlertCircle,
  Check, Wand2,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toLocalDatetimeInputs(iso: string) {
  const d = new Date(iso);
  const date = d.toISOString().split("T")[0];
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

const statusConfig: Record<string, {
  label: string;
  variant: "success" | "warning" | "ghost" | "default" | "destructive";
  icon: typeof CheckCircle2;
}> = {
  scheduled:  { label: "Programada",  variant: "default",     icon: Clock },
  pending:    { label: "Pendiente",   variant: "default",     icon: Clock },
  generating: { label: "Generando",   variant: "warning",     icon: Loader2 },
  generated:  { label: "Lista",       variant: "warning",     icon: CheckCircle2 },
  publishing: { label: "Publicando",  variant: "warning",     icon: Share2 },
  published:  { label: "Publicada",   variant: "success",     icon: CheckCircle2 },
  failed:     { label: "Falló",       variant: "destructive", icon: AlertCircle },
  draft:      { label: "Borrador",    variant: "ghost",       icon: Clock },
};

const targetOptions = [
  { value: "facebook_feed",   label: "Facebook Feed",   icon: Facebook,  color: "#1877F2", isFeed: true  },
  { value: "instagram_feed",  label: "Instagram Feed",  icon: Instagram, color: "#E4405F", isFeed: true  },
  { value: "instagram_story", label: "Instagram Story", icon: Instagram, color: "#C13584", isFeed: false },
];

const GALLERY_PAGE = 9;
const HISTORY_PAGE = 8;

export default function SchedulePage() {
  const token = useAuthStore((s) => s.token) ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const [gallery, setGallery] = useState<PublicationOut[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryPage, setGalleryPage] = useState(1);

  const [history, setHistory] = useState<PublicationOut[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPub, setSelectedPub] = useState<PublicationOut | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [saving, setSaving] = useState(false);

  const hasFeedTarget = targets.some((t) => t.includes("feed"));

  const refreshHistory = (tk: string) =>
    api.publications.list(tk).then(setHistory).catch(() => {});

  useEffect(() => {
    if (!token) return;
    api.publications.list(token)
      .then((data) => {
        setGallery(data.filter((p) => p.image_url));
        setHistory(data);
      })
      .catch(() => {})
      .finally(() => { setGalleryLoading(false); setHistoryLoading(false); });
  }, [token]);

  const toggleTarget = (t: string) =>
    setTargets((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleSelectPub = (pub: PublicationOut) => {
    setSelectedPub(pub);
    // Pre-fill caption from existing publication
    const existingCaption = pub.caption || "";
    // If it has hashtags at the end (lines starting with #), split them out
    const lines = existingCaption.split("\n\n");
    const lastBlock = lines[lines.length - 1];
    if (lastBlock?.trim().startsWith("#")) {
      setCaption(lines.slice(0, -1).join("\n\n").trim());
      setHashtags(lastBlock.trim());
    } else {
      setCaption(existingCaption);
      setHashtags("");
    }
    // Pre-fill targets and date if already set
    if (pub.targets.length) setTargets(pub.targets);
    if (pub.scheduled_at) {
      const { date, time } = toLocalDatetimeInputs(pub.scheduled_at);
      setScheduleDate(date);
      setScheduleTime(time);
    }
  };

  const handleClear = () => {
    setSelectedPub(null);
    setCaption(""); setHashtags(""); setTargets([]);
    setScheduleDate(""); setScheduleTime("");
  };

  const handleSchedule = async () => {
    if (!selectedPub) return toast.error("Selecciona una imagen de la biblioteca");
    if (!targets.length) return toast.error("Selecciona al menos una plataforma");
    if (!scheduleDate || !scheduleTime) return toast.error("Selecciona fecha y hora");

    const hashtagsStr = hashtags.trim()
      ? hashtags.trim().startsWith("#") ? hashtags.trim() : "#" + hashtags.trim().replace(/\s+/g, " #")
      : "";
    const finalCaption = hasFeedTarget && hashtagsStr
      ? `${caption.trim()}${caption.trim() ? "\n\n" : ""}${hashtagsStr}`
      : caption.trim();

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();

    setSaving(true);
    try {
      await api.publications.update(selectedPub.id, {
        caption: finalCaption || null,
        targets,
        scheduled_at: scheduledAt,
        status: "scheduled",
      }, token!);
      toast.success("Publicación programada correctamente");
      handleClear();
      refreshHistory(token!).then(() => {
        setGalleryLoading(true);
        api.publications.list(token!).then((data) => {
          setGallery(data.filter((p) => p.image_url));
          setGalleryLoading(false);
        }).catch(() => setGalleryLoading(false));
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al programar");
    } finally {
      setSaving(false);
    }
  };

  // Gallery pagination
  const galleryTotalPages = Math.ceil(gallery.length / GALLERY_PAGE);
  const paginatedGallery = gallery.slice((galleryPage - 1) * GALLERY_PAGE, galleryPage * GALLERY_PAGE);

  // History filter + pagination
  const filteredHistory = statusFilter === "all"
    ? history
    : history.filter((p) => p.status === statusFilter);
  const historyTotalPages = Math.ceil(filteredHistory.length / HISTORY_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * HISTORY_PAGE,
    historyPage * HISTORY_PAGE
  );

  const card = "rounded-2xl border border-border bg-card p-4 md:p-5";

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Programar</h2>
        <p className="text-xs text-muted-foreground">Selecciona una imagen y configura tu publicación</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">

        {/* ── Biblioteca (imágenes reales) ── */}
        <div className={cn(card, "lg:col-span-4")}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Biblioteca</h3>
            <Link href="/media">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Ver galería →
              </span>
            </Link>
          </div>

          {galleryLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : gallery.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <ImageIcon size={28} className="opacity-20" />
              <p className="text-xs text-center">Sin imágenes generadas.<br />Genera una imagen primero.</p>
              <Link href="/generate">
                <span className="text-xs text-primary hover:underline cursor-pointer flex items-center gap-1">
                  <Wand2 size={11} /> Generar imagen
                </span>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {paginatedGallery.map((pub) => {
                  const isSelected = selectedPub?.id === pub.id;
                  return (
                    <button
                      key={pub.id}
                      onClick={() => isSelected ? handleClear() : handleSelectPub(pub)}
                      className={cn(
                        "relative group rounded-xl overflow-hidden border-2 transition-all",
                        isSelected
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="aspect-square bg-muted">
                        <img
                          src={toAbsoluteUrl(pub.image_url!)}
                          alt={pub.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                            <Check size={11} className="text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] font-medium truncate leading-tight">{pub.title}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {galleryTotalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{gallery.length} imágenes</span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={galleryPage === 1}
                      onClick={() => setGalleryPage((p) => p - 1)}
                      className="p-1 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <span>{galleryPage}/{galleryTotalPages}</span>
                    <button
                      disabled={galleryPage === galleryTotalPages}
                      onClick={() => setGalleryPage((p) => p + 1)}
                      className="p-1 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Formulario ── */}
        <div className={cn(card, "lg:col-span-8 space-y-4")}>
          <h3 className="text-sm font-semibold text-foreground">Nueva programación</h3>

          {/* Selected image preview */}
          {selectedPub ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border bg-muted">
                <img
                  src={toAbsoluteUrl(selectedPub.image_url!)}
                  alt={selectedPub.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{selectedPub.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{selectedPub.prompt}</p>
                <Badge variant={statusConfig[selectedPub.status]?.variant ?? "ghost"} className="mt-1 gap-1 text-[10px]">
                  {selectedPub.status}
                </Badge>
              </div>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                title="Quitar selección"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon size={16} className="opacity-30" />
              <span className="text-xs">Selecciona una imagen de la biblioteca ←</span>
            </div>
          )}

          {/* Plataformas */}
          <div>
            <label className="text-xs font-semibold text-foreground/70 mb-2 block">Plataformas</label>
            <div className="flex flex-wrap gap-2">
              {targetOptions.map(({ value, label, icon: Icon, color }) => {
                const active = targets.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggleTarget(value)}
                    className={cn(
                      "h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all",
                      active
                        ? "border-transparent text-white shadow-sm"
                        : "border-border text-muted-foreground hover:text-foreground bg-muted hover:border-border/80"
                    )}
                    style={active ? { backgroundColor: color } : undefined}
                  >
                    <Icon size={13} />
                    {label}
                    {active && <Check size={11} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-foreground/70 mb-2 flex items-center gap-1.5">
              <AlignLeft size={11} /> Descripción / Caption
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Escribe el texto que acompañará tu publicación..."
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {/* Hashtags — solo feed */}
          {hasFeedTarget && (
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 flex items-center gap-1.5">
                <Hash size={11} /> Hashtags
                <span className="font-normal text-muted-foreground">(solo posts de feed)</span>
              </label>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#degava #restaurante #oferta #comida"
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                Escríbelos con # o sin — se añaden automáticamente al final de la descripción.
              </p>
            </div>
          )}

          {/* Fecha y Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 flex items-center gap-1.5">
                <CalendarDays size={11} /> Fecha
              </label>
              <input
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground/70 mb-2 flex items-center gap-1.5">
                <Clock size={11} /> Hora
              </label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          {/* Preview del caption final */}
          {(caption.trim() || hashtags.trim()) && hasFeedTarget && (
            <div className="rounded-xl bg-muted/60 border border-border p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Preview caption</p>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {caption.trim()}
                {caption.trim() && hashtags.trim() ? "\n\n" : ""}
                {hashtags.trim() && (
                  <span className="text-primary">
                    {hashtags.trim().startsWith("#") ? hashtags.trim() : "#" + hashtags.trim().replace(/\s+/g, " #")}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Botón programar */}
          <button
            onClick={handleSchedule}
            disabled={saving || !selectedPub || !targets.length || !scheduleDate || !scheduleTime}
            className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Programando...</>
              : <><Save size={15} /> Programar Publicación</>}
          </button>
        </div>
      </div>

      {/* ── Historial real ── */}
      <div className={card}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-sm font-semibold text-foreground">Historial de Publicaciones</h3>
          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "all",       label: "Todos" },
              { value: "scheduled", label: "Programadas" },
              { value: "generated", label: "Listas" },
              { value: "published", label: "Publicadas" },
              { value: "failed",    label: "Fallidas" },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => { setStatusFilter(value); setHistoryPage(1); }}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                  statusFilter === value
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center h-20">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : paginatedHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Sin publicaciones</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[580px]">
              <thead>
                <tr className="border-b border-border">
                  {["Imagen", "Título / Caption", "Fecha programada", "Plataformas", "Estado", ""].map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        "py-2.5 px-3 text-xs font-semibold text-muted-foreground",
                        i === 5 ? "text-right" : "text-left"
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((pub) => {
                  const s = statusConfig[pub.status] ?? statusConfig.draft;
                  return (
                    <tr key={pub.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="w-11 h-11 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                          {pub.image_url
                            ? <img src={toAbsoluteUrl(pub.image_url)} alt="" className="w-full h-full object-cover" />
                            : <ImageIcon size={14} className="text-muted-foreground/30" />}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <p className="font-medium text-foreground truncate text-xs">{pub.title}</p>
                        {pub.caption && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{pub.caption}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} />
                          {formatDate(pub.scheduled_at)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1">
                          {pub.targets.length === 0 && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {pub.targets.map((t) => {
                            const opt = targetOptions.find((o) => o.value === t);
                            if (!opt) return null;
                            const Icon = opt.icon;
                            return (
                              <span
                                key={t}
                                className="w-6 h-6 rounded-md flex items-center justify-center border border-border bg-muted"
                                title={opt.label}
                              >
                                <Icon size={11} style={{ color: opt.color }} />
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={s.variant} className="gap-1 whitespace-nowrap text-[10px]">
                          <s.icon size={9} />{s.label}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex justify-end gap-1">
                          {pub.image_url && (
                            <button
                              onClick={() => window.open(toAbsoluteUrl(pub.image_url!), "_blank")}
                              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                              title="Ver imagen"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                          <button
                            onClick={() => handleSelectPub(pub)}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
                            title="Editar programación"
                          >
                            <CalendarDays size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {historyTotalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>{filteredHistory.length} publicaciones</span>
            <div className="flex items-center gap-1">
              <button
                disabled={historyPage === 1}
                onClick={() => setHistoryPage((p) => p - 1)}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-2">{historyPage}/{historyTotalPages}</span>
              <button
                disabled={historyPage === historyTotalPages}
                onClick={() => setHistoryPage((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
