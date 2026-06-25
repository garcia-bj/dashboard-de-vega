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
  Check, Wand2, Sparkles, Layers, Image as ImageSingle,
  ArrowLeft, ArrowRight, Zap, Send, ShieldAlert, ExternalLink,
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
  { value: "facebook_story",  label: "Facebook Story",  icon: Facebook,  color: "#0866FF", isFeed: false },
  { value: "instagram_feed",  label: "Instagram Feed",  icon: Instagram, color: "#E4405F", isFeed: true  },
  { value: "instagram_story", label: "Instagram Story", icon: Instagram, color: "#C13584", isFeed: false },
];

const GALLERY_SIZE = 9;
const HISTORY_SIZE = 8;

export default function SchedulePage() {
  const token = useAuthStore((s) => s.token) ||
    (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  // Data
  const [gallery, setGallery] = useState<PublicationOut[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryPage, setGalleryPage] = useState(1);
  const [history, setHistory] = useState<PublicationOut[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  // Form
  const [pubType, setPubType] = useState<"single" | "carousel">("single");
  const [selectedPubs, setSelectedPubs] = useState<PublicationOut[]>([]);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [targets, setTargets] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<{ target: string; success: boolean; permalink?: string; error?: string }[] | null>(null);
  const [enhancingCaption, setEnhancingCaption] = useState(false);
  const [generatingHashtags, setGeneratingHashtags] = useState(false);

  const hasFeedTarget = targets.some((t) => t.includes("feed"));
  const primaryPub = selectedPubs[0] ?? null;

  const loadGallery = (tk: string) =>
    api.publications.list(tk)
      .then((data) => {
        setGallery(data.filter((p) => p.image_url));
        setHistory(data);
      })
      .catch(() => {})
      .finally(() => { setGalleryLoading(false); setHistoryLoading(false); });

  useEffect(() => { if (token) loadGallery(token); }, [token]);

  // ── Gallery selection ──
  const isSelected = (pub: PublicationOut) => selectedPubs.some((p) => p.id === pub.id);

  const handleSelectPub = (pub: PublicationOut) => {
    if (pubType === "single") {
      if (isSelected(pub)) {
        handleClear();
      } else {
        setSelectedPubs([pub]);
        prefillFromPub(pub);
      }
    } else {
      // carousel mode
      if (isSelected(pub)) {
        setSelectedPubs((prev) => prev.filter((p) => p.id !== pub.id));
      } else {
        setSelectedPubs((prev) => [...prev, pub]);
        // prefill from first selection
        if (selectedPubs.length === 0) prefillFromPub(pub);
      }
    }
  };

  const prefillFromPub = (pub: PublicationOut) => {
    const existingCaption = pub.caption || "";
    const lines = existingCaption.split("\n\n");
    const lastBlock = lines[lines.length - 1];
    if (lastBlock?.trim().startsWith("#")) {
      setCaption(lines.slice(0, -1).join("\n\n").trim());
      setHashtags(lastBlock.trim());
    } else {
      setCaption(existingCaption);
      setHashtags("");
    }
    if (pub.targets.length) setTargets(pub.targets);
    if (pub.scheduled_at) {
      const { date, time } = toLocalDatetimeInputs(pub.scheduled_at);
      setScheduleDate(date); setScheduleTime(time);
    }
  };

  const handleClear = () => {
    setSelectedPubs([]);
    setCaption(""); setHashtags(""); setTargets([]);
    setScheduleDate(""); setScheduleTime("");
    setPublishResults(null);
  };

  // Carousel reorder
  const moveImage = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= selectedPubs.length) return;
    setSelectedPubs((prev) => {
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  };

  // Switch type — clear selections
  const switchType = (t: "single" | "carousel") => {
    setPubType(t);
    handleClear();
  };

  // ── AI buttons ──
  const handleEnhanceCaption = async () => {
    if (!token) return;
    setEnhancingCaption(true);
    try {
      const context = selectedPubs.map((p) => p.prompt).join(", ");
      const data = await api.publish.enhanceCaption(
        { caption: caption.trim(), context, mode: "caption" }, token
      );
      if (data.enhanced_caption) { setCaption(data.enhanced_caption); toast.success("Caption mejorado"); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al mejorar caption");
    } finally { setEnhancingCaption(false); }
  };

  const handleGenerateHashtags = async () => {
    if (!token) return;
    setGeneratingHashtags(true);
    try {
      const context = selectedPubs.map((p) => p.prompt).join(", ");
      const data = await api.publish.enhanceCaption(
        { caption: caption.trim(), context, mode: "hashtags", hashtag_count: 12 }, token
      );
      if (data.hashtags) { setHashtags(data.hashtags); toast.success("Hashtags generados"); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al generar hashtags");
    } finally { setGeneratingHashtags(false); }
  };

  // ── Helpers ──
  const buildFinalCaption = () => {
    const hashtagsStr = hashtags.trim()
      ? hashtags.trim().startsWith("#") ? hashtags.trim() : "#" + hashtags.trim().replace(/\s+/g, " #")
      : "";
    return hasFeedTarget && hashtagsStr
      ? `${caption.trim()}${caption.trim() ? "\n\n" : ""}${hashtagsStr}`
      : caption.trim();
  };

  const buildMetaData = (): Record<string, unknown> =>
    pubType === "carousel"
      ? { carousel: true, carousel_images: selectedPubs.map((p) => toAbsoluteUrl(p.image_url!)) }
      : {};

  const validateForm = () => {
    if (!primaryPub) { toast.error("Selecciona al menos una imagen"); return false; }
    if (pubType === "carousel" && selectedPubs.length < 2) { toast.error("El carrusel necesita al menos 2 imágenes"); return false; }
    if (!targets.length) { toast.error("Selecciona al menos una plataforma"); return false; }
    return true;
  };

  const checkMetaAccounts = async (): Promise<boolean> => {
    try {
      const accounts = await api.publish.validateAccounts(token!);
      const active = accounts.filter((a) => a.is_active);
      const missing: string[] = [];
      if ((targets.includes("facebook_feed") || targets.includes("facebook_story")) &&
          !active.some((a) => a.provider === "facebook"))
        missing.push("Facebook");
      if ((targets.includes("instagram_feed") || targets.includes("instagram_story")) &&
          !active.some((a) => a.provider === "instagram"))
        missing.push("Instagram");
      if (missing.length > 0) {
        toast.error(
          `Cuenta${missing.length > 1 ? "s" : ""} de ${missing.join(" e ")} no conectada${missing.length > 1 ? "s" : ""}. Configúrala en Configuración → Redes Sociales.`,
          { duration: 6000, icon: <ShieldAlert size={16} /> }
        );
        return false;
      }
      return true;
    } catch {
      toast.error("No se pudo verificar las cuentas de Meta");
      return false;
    }
  };

  // ── Submit ──
  const handleSchedule = async () => {
    if (!validateForm()) return;
    if (!scheduleDate || !scheduleTime) return toast.error("Selecciona fecha y hora");

    setSaving(true);
    try {
      await api.publications.update(primaryPub!.id, {
        caption: buildFinalCaption() || null,
        targets,
        scheduled_at: new Date(`${scheduleDate}T${scheduleTime}`).toISOString(),
        status: "scheduled",
        meta_data: buildMetaData(),
      }, token!);
      toast.success(pubType === "carousel" ? "Carrusel programado" : "Publicación programada");
      handleClear();
      if (token) loadGallery(token);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al programar");
    } finally { setSaving(false); }
  };

  const handlePublishNow = async () => {
    if (!validateForm()) return;
    const ok = await checkMetaAccounts();
    if (!ok) return;

    setPublishing(true);
    try {
      // Save caption/targets first
      await api.publications.update(primaryPub!.id, {
        caption: buildFinalCaption() || null,
        targets,
        meta_data: buildMetaData(),
        status: "generated",
      }, token!);

      // Then publish immediately
      const result = await api.publish.publish(primaryPub!.id, token!);
      const successes = result.results.filter((r) => r.success);
      const failures  = result.results.filter((r) => !r.success);
      setPublishResults(result.results);

      if (successes.length > 0) {
        toast.success(`Publicado en ${successes.length} plataforma${successes.length > 1 ? "s" : ""}`);
      }
      if (failures.length > 0) {
        failures.forEach((f) => toast.error(`Error en ${f.target}: ${f.error}`));
      }
      // Don't clear — show results panel with permalink links
      if (token) loadGallery(token);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al publicar");
    } finally { setPublishing(false); }
  };

  // ── Pagination ──
  const galleryTotalPages = Math.ceil(gallery.length / GALLERY_SIZE);
  const paginatedGallery = gallery.slice((galleryPage - 1) * GALLERY_SIZE, galleryPage * GALLERY_SIZE);

  const filteredHistory = statusFilter === "all"
    ? history : history.filter((p) => p.status === statusFilter);
  const historyTotalPages = Math.ceil(filteredHistory.length / HISTORY_SIZE);
  const paginatedHistory = filteredHistory.slice(
    (historyPage - 1) * HISTORY_SIZE, historyPage * HISTORY_SIZE
  );

  const card = "rounded-2xl border border-border bg-card p-4 md:p-5";
  const fieldLabel = "text-xs font-semibold text-foreground/70 mb-2 flex items-center gap-1.5";

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Programar</h2>
        <p className="text-xs text-muted-foreground">Selecciona imágenes y configura tu publicación</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">

        {/* ── Biblioteca ── */}
        <div className={cn(card, "lg:col-span-4")}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Biblioteca</h3>
            <Link href="/media">
              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                Ver galería →
              </span>
            </Link>
          </div>

          {/* Tipo de publicación */}
          <div className="flex rounded-xl overflow-hidden border border-border mb-3">
            <button
              onClick={() => switchType("single")}
              className={cn(
                "flex-1 h-8 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                pubType === "single" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <ImageSingle size={11} /> Imagen
            </button>
            <button
              onClick={() => switchType("carousel")}
              className={cn(
                "flex-1 h-8 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                pubType === "carousel" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Layers size={11} /> Carrusel
            </button>
          </div>

          {pubType === "carousel" && (
            <p className="text-[10px] text-muted-foreground mb-2 bg-muted/60 rounded-lg px-2.5 py-1.5">
              Selecciona 2–10 imágenes en orden. Se publicarán como carrusel.
            </p>
          )}

          {galleryLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : gallery.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
              <ImageIcon size={28} className="opacity-20" />
              <p className="text-xs text-center">Sin imágenes generadas.</p>
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
                  const sel = isSelected(pub);
                  const selIdx = selectedPubs.findIndex((p) => p.id === pub.id);
                  return (
                    <button
                      key={pub.id}
                      onClick={() => handleSelectPub(pub)}
                      className={cn(
                        "relative group rounded-xl overflow-hidden border-2 transition-all",
                        sel ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="aspect-square bg-muted">
                        <img src={toAbsoluteUrl(pub.image_url!)} alt={pub.title} className="w-full h-full object-cover" />
                      </div>
                      {sel && (
                        <div className="absolute top-1.5 left-1.5">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow",
                            pubType === "carousel" ? "bg-primary" : "bg-primary"
                          )}>
                            {pubType === "carousel" ? selIdx + 1 : <Check size={10} />}
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
                    <button disabled={galleryPage === 1} onClick={() => setGalleryPage((p) => p - 1)}
                      className="p-1 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors">
                      <ChevronLeft size={13} />
                    </button>
                    <span>{galleryPage}/{galleryTotalPages}</span>
                    <button disabled={galleryPage === galleryTotalPages} onClick={() => setGalleryPage((p) => p + 1)}
                      className="p-1 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors">
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
          <h3 className="text-sm font-semibold text-foreground">
            {pubType === "carousel" ? "Configurar Carrusel" : "Nueva Publicación"}
          </h3>

          {/* Selected preview */}
          {selectedPubs.length === 0 ? (
            <div className="h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-muted-foreground">
              <ImageIcon size={16} className="opacity-30" />
              <span className="text-xs">
                {pubType === "carousel"
                  ? "Selecciona 2 o más imágenes ←"
                  : "Selecciona una imagen de la biblioteca ←"}
              </span>
            </div>
          ) : pubType === "single" ? (
            /* Single preview */
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-border bg-muted">
                <img src={toAbsoluteUrl(primaryPub!.image_url!)} alt={primaryPub!.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{primaryPub!.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{primaryPub!.prompt}</p>
                <Badge variant={statusConfig[primaryPub!.status]?.variant ?? "ghost"} className="mt-1 gap-1 text-[10px]">
                  {primaryPub!.status}
                </Badge>
              </div>
              <button onClick={handleClear}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                <X size={14} />
              </button>
            </div>
          ) : (
            /* Carousel preview — ordered list with reorder arrows */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/70">{selectedPubs.length} imágenes seleccionadas</span>
                <button onClick={handleClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
                  <X size={11} /> Limpiar todo
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {selectedPubs.map((pub, idx) => (
                  <div key={pub.id} className="relative rounded-xl overflow-hidden border border-border bg-muted group">
                    <div className="aspect-video">
                      <img src={toAbsoluteUrl(pub.image_url!)} alt={pub.title} className="w-full h-full object-cover" />
                    </div>
                    {/* Order badge */}
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow">
                      {idx + 1}
                    </div>
                    {/* Controls */}
                    <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => moveImage(idx, -1)} disabled={idx === 0}
                        className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition-colors">
                        <ArrowLeft size={9} />
                      </button>
                      <button onClick={() => moveImage(idx, 1)} disabled={idx === selectedPubs.length - 1}
                        className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition-colors">
                        <ArrowRight size={9} />
                      </button>
                      <button onClick={() => setSelectedPubs((p) => p.filter((x) => x.id !== pub.id))}
                        className="w-5 h-5 rounded bg-black/60 text-white flex items-center justify-center hover:bg-red-600/80 transition-colors">
                        <X size={9} />
                      </button>
                    </div>
                    <p className="text-[10px] font-medium text-foreground truncate p-1.5 leading-none">{pub.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plataformas */}
          <div>
            <label className={fieldLabel}>Plataformas</label>
            <div className="flex flex-wrap gap-2">
              {targetOptions.map(({ value, label, icon: Icon, color, isFeed }) => {
                if (pubType === "carousel" && !isFeed) return null; // stories no soportan carrusel
                const active = targets.includes(value);
                return (
                  <button key={value} onClick={() => setTargets((p) => p.includes(value) ? p.filter((x) => x !== value) : [...p, value])}
                    className={cn(
                      "h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all",
                      active ? "border-transparent text-white shadow-sm" : "border-border text-muted-foreground hover:text-foreground bg-muted"
                    )}
                    style={active ? { backgroundColor: color } : undefined}
                  >
                    <Icon size={13} />{label}{active && <Check size={11} />}
                  </button>
                );
              })}
              {pubType === "carousel" && (
                <span className="text-[10px] text-muted-foreground self-center">
                  (Stories no soporta carrusel)
                </span>
              )}
            </div>
          </div>

          {/* Descripción con botón IA */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={cn(fieldLabel, "mb-0")}>
                <AlignLeft size={11} /> Descripción / Caption
              </label>
              <button
                onClick={handleEnhanceCaption}
                disabled={enhancingCaption}
                className="h-7 px-2.5 rounded-lg text-xs font-medium border border-secondary/30 text-secondary hover:bg-secondary/10 disabled:opacity-40 transition-colors flex items-center gap-1.5"
              >
                {enhancingCaption
                  ? <><Loader2 size={11} className="animate-spin" /> Mejorando...</>
                  : <><Zap size={11} /> Mejorar con IA</>}
              </button>
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              placeholder="Escribe el texto que acompañará tu publicación..."
              className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {/* Hashtags con botón IA — solo feed */}
          {hasFeedTarget && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={cn(fieldLabel, "mb-0")}>
                  <Hash size={11} /> Hashtags
                  <span className="font-normal text-muted-foreground">(solo feed)</span>
                </label>
                <button
                  onClick={handleGenerateHashtags}
                  disabled={generatingHashtags}
                  className="h-7 px-2.5 rounded-lg text-xs font-medium border border-secondary/30 text-secondary hover:bg-secondary/10 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                >
                  {generatingHashtags
                    ? <><Loader2 size={11} className="animate-spin" /> Generando...</>
                    : <><Sparkles size={11} /> Generar con IA</>}
                </button>
              </div>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#degava #restaurante #oferta #comida"
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                Escríbelos con # o sin — se añaden al final del caption.
              </p>
            </div>
          )}

          {/* Preview caption */}
          {(caption.trim() || hashtags.trim()) && hasFeedTarget && (
            <div className="rounded-xl bg-muted/60 border border-border p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Preview</p>
              <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                {caption.trim()}
                {caption.trim() && hashtags.trim() ? "\n\n" : ""}
                {hashtags.trim() && (
                  <span className="text-primary">
                    {hashtags.trim().startsWith("#")
                      ? hashtags.trim()
                      : "#" + hashtags.trim().replace(/\s+/g, " #")}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Fecha y hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={fieldLabel}><CalendarDays size={11} /> Fecha</label>
              <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
            </div>
            <div>
              <label className={fieldLabel}><Clock size={11} /> Hora</label>
              <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors" />
            </div>
          </div>

          {/* Resultado de publicación */}
          {publishResults && (
            <div className="rounded-xl border border-border bg-muted/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-foreground">Resultado de publicación</p>
                <button onClick={() => setPublishResults(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={12} /></button>
              </div>
              {publishResults.map((r) => (
                <div key={r.target} className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${r.success ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                  <span className="font-medium capitalize">{r.target.replace(/_/g, " ")}</span>
                  {r.permalink
                    ? <a href={r.permalink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline font-semibold">
                        Ver publicación <ExternalLink size={10} />
                      </a>
                    : <span>{r.success ? "Publicado" : r.error?.slice(0, 40)}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Publicar Ahora */}
            <button
              onClick={handlePublishNow}
              disabled={publishing || saving || !primaryPub || !targets.length
                || (pubType === "carousel" && selectedPubs.length < 2)}
              className="flex-1 h-11 sm:h-10 rounded-xl text-sm font-semibold border border-secondary/40 text-secondary hover:bg-secondary/10 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {publishing
                ? <><Loader2 size={15} className="animate-spin" /> Publicando...</>
                : <><Send size={15} /> Publicar Ahora</>}
            </button>
            {/* Programar */}
            <button
              onClick={handleSchedule}
              disabled={saving || publishing || !primaryPub || !targets.length || !scheduleDate || !scheduleTime
                || (pubType === "carousel" && selectedPubs.length < 2)}
              className="flex-1 h-11 sm:h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
            >
              {saving
                ? <><Loader2 size={15} className="animate-spin" /> Programando...</>
                : pubType === "carousel"
                  ? <><Layers size={15} /> Programar Carrusel</>
                  : <><Save size={15} /> Programar</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Panel de estado rápido ── */}
      {!historyLoading && history.length > 0 && (() => {
        const now = new Date();
        const stats = [
          {
            label: "Listas para publicar",
            value: history.filter((p) => p.status === "generated").length,
            icon: CheckCircle2,
            color: "text-amber-400",
            bg: "border-amber-500/20 from-amber-500/10",
            filter: "generated",
          },
          {
            label: "Programadas",
            value: history.filter((p) => p.status === "scheduled").length,
            icon: Clock,
            color: "text-blue-400",
            bg: "border-blue-500/20 from-blue-500/10",
            filter: "scheduled",
          },
          {
            label: "Publicadas hoy",
            value: history.filter((p) => p.status === "published" && p.published_at && new Date(p.published_at).toDateString() === now.toDateString()).length,
            icon: CheckCircle2,
            color: "text-emerald-400",
            bg: "border-emerald-500/20 from-emerald-500/10",
            filter: "published",
          },
          {
            label: "Fallidas",
            value: history.filter((p) => p.status === "failed").length,
            icon: AlertCircle,
            color: "text-destructive",
            bg: "border-destructive/20 from-destructive/10",
            filter: "failed",
          },
        ];
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.map((s) => (
              <button
                key={s.label}
                onClick={() => { setStatusFilter(s.filter); setHistoryPage(1); document.getElementById("historial")?.scrollIntoView({ behavior: "smooth" }); }}
                className={cn(
                  "rounded-2xl border bg-card p-4 text-left hover:border-opacity-80 transition-all relative overflow-hidden",
                  s.bg.split(" ")[0]
                )}
              >
                <div className={`absolute top-0 left-0 w-full h-1/2 pointer-events-none bg-gradient-to-b ${s.bg.split(" ")[1]} to-transparent`} />
                <div className="relative z-10">
                  <s.icon size={16} className={cn("mb-2", s.color)} />
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              </button>
            ))}
          </div>
        );
      })()}

      {/* ── Historial ── */}
      <div id="historial" className={card}>
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
              <button key={value}
                onClick={() => { setStatusFilter(value); setHistoryPage(1); }}
                className={cn(
                  "h-7 px-3 rounded-lg text-xs font-medium transition-colors",
                  statusFilter === value ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:text-foreground"
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
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-border">
                  {["Imagen", "Título / Caption", "Tipo", "Fecha", "Plataformas", "Estado", ""].map((h, i) => (
                    <th key={i} className={cn("py-2.5 px-3 text-xs font-semibold text-muted-foreground", i === 6 ? "text-right" : "text-left")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.map((pub) => {
                  const s = statusConfig[pub.status] ?? statusConfig.draft;
                  const isCarousel = pub.meta_data?.carousel === true;
                  const carouselCount = (pub.meta_data?.carousel_images as string[] | undefined)?.length ?? 0;
                  return (
                    <tr key={pub.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="w-11 h-11 rounded-xl bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
                          {pub.image_url
                            ? <img src={toAbsoluteUrl(pub.image_url)} alt="" className="w-full h-full object-cover" />
                            : <ImageIcon size={14} className="text-muted-foreground/30" />}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-[180px]">
                        <p className="font-medium text-foreground truncate text-xs">{pub.title}</p>
                        {pub.caption && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{pub.caption}</p>}
                      </td>
                      <td className="py-2.5 px-3">
                        {isCarousel
                          ? <Badge variant="default" className="gap-1 text-[10px] whitespace-nowrap"><Layers size={8} />{carouselCount} imgs</Badge>
                          : <Badge variant="ghost" className="gap-1 text-[10px]"><ImageSingle size={8} />Imagen</Badge>}
                      </td>
                      <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1"><CalendarDays size={11} />{formatDate(pub.scheduled_at)}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex gap-1">
                          {pub.targets.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                          {pub.targets.map((t) => {
                            const opt = targetOptions.find((o) => o.value === t);
                            if (!opt) return null;
                            const Icon = opt.icon;
                            return (
                              <span key={t} className="w-6 h-6 rounded-md flex items-center justify-center border border-border bg-muted" title={opt.label}>
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
                            <button onClick={() => window.open(toAbsoluteUrl(pub.image_url!), "_blank")}
                              className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Ver imagen">
                              <Eye size={13} />
                            </button>
                          )}
                          <button onClick={() => { prefillFromPub(pub); setSelectedPubs([pub]); setPubType("single"); }}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-primary transition-colors" title="Editar programación">
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
              <button disabled={historyPage === 1} onClick={() => setHistoryPage((p) => p - 1)}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="px-2">{historyPage}/{historyTotalPages}</span>
              <button disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage((p) => p + 1)}
                className="p-1.5 rounded-lg hover:bg-accent disabled:opacity-30 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
