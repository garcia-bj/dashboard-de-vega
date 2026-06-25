"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { api, VideoProjectOut } from "@/lib/api";
import {
  Video, Upload, X, Loader2, CheckCircle2, AlertCircle,
  Trash2, Clock, Play,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

const STATUS_MAP: Record<VideoProjectOut["status"], { label: string; color: string }> = {
  PENDING:    { label: "En cola",      color: "text-muted-foreground bg-muted border-border" },
  PROCESSING: { label: "Procesando",   color: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
  DONE:       { label: "Listo",        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  FAILED:     { label: "Fallido",      color: "text-destructive bg-destructive/10 border-destructive/30" },
};

export default function VideoPage() {
  const token = useAuthStore((s) => s.token) || (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<VideoProjectOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) return;
    api.video.list(token)
      .then(setProjects)
      .catch(() => toast.error("No se pudieron cargar los proyectos"))
      .finally(() => setLoading(false));
  }, [token]);

  // Poll in-progress projects
  useEffect(() => {
    if (!token || pollingIds.size === 0) return;
    pollRef.current = setInterval(async () => {
      for (const id of pollingIds) {
        try {
          const updated = await api.video.get(id, token);
          setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
          if (updated.status === "DONE" || updated.status === "FAILED") {
            setPollingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
            if (updated.status === "DONE") toast.success("¡Video procesado exitosamente!");
            else toast.error(`Error: ${updated.meta_data?.error || "No se pudo procesar el video"}`);
          }
        } catch { /* ignore transient */ }
      }
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [pollingIds, token]);

  const handleFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      toast.error("Solo se aceptan archivos de video");
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      toast.error("El video no puede superar 100MB");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim() || !prompt.trim()) return;
    if (!token) { toast.error("Sesión expirada"); return; }
    setSubmitting(true);
    try {
      const project = await api.video.create(title.trim(), prompt.trim(), file, token);
      setProjects((prev) => [project, ...prev]);
      if (project.status === "PENDING" || project.status === "PROCESSING") {
        setPollingIds((prev) => new Set(prev).add(project.id));
      }
      setFile(null); setTitle(""); setPrompt("");
      toast.success("Video enviado para procesamiento");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await api.video.delete(id, token);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setPollingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      toast("Proyecto eliminado");
    } catch {
      toast.error("No se pudo eliminar el proyecto");
    }
  };

  const card = "rounded-2xl border border-border bg-card p-5";
  const fieldLabel = "text-xs font-semibold text-foreground/70 mb-2 block";

  return (
    <div className="space-y-5 max-w-7xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Editar Video con IA</h2>
        <p className="text-xs text-muted-foreground">Subí tu video y describí los cambios que querés aplicar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Upload panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className={card}>
            <label className={fieldLabel}>Video</label>
            <div
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center min-h-[160px] cursor-pointer hover:border-primary/50 transition-colors"
            >
              {file ? (
                <div className="flex items-center gap-3 px-4 w-full">
                  <Video size={22} className="text-primary flex-shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <Upload size={26} className="text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Arrastrá un video o hacé clic</p>
                  <p className="text-xs text-muted-foreground/50 mt-1">MP4, MOV, WebM — máx. 100MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>

          <div className={card + " space-y-4"}>
            <div>
              <label className={fieldLabel}>Título del proyecto</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Promo de verano"
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
            <div>
              <label className={fieldLabel}>Prompt de edición</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder="Describí los cambios: eliminar el fondo, agregar subtítulos, cambiar el ritmo, aplicar slow-motion..."
                className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !file || !title.trim() || !prompt.trim()}
            className="w-full h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
          >
            {submitting
              ? <><Loader2 size={15} className="animate-spin" /> Enviando...</>
              : <><Video size={15} /> Procesar Video</>}
          </button>
        </div>

        {/* Projects list */}
        <div className="lg:col-span-7 space-y-4">
          <div className={card}>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-muted-foreground" />
              <h3 className="text-base font-semibold">Proyectos</h3>
              {pollingIds.size > 0 && (
                <span className="ml-auto flex items-center gap-1.5 text-xs text-blue-400">
                  <Loader2 size={12} className="animate-spin" /> Procesando...
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="animate-spin text-muted-foreground/40" />
              </div>
            ) : projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 flex flex-col items-center gap-2 text-muted-foreground">
                <Video size={28} className="opacity-20" />
                <p className="text-sm">Sin proyectos — subí tu primer video</p>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {projects.map((p) => {
                    const s = STATUS_MAP[p.status];
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-xl border border-border bg-muted/40 p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{p.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.prompt}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", s.color)}>
                              {p.status === "PROCESSING" && <Loader2 size={10} className="inline mr-1 animate-spin" />}
                              {s.label}
                            </span>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {p.status === "DONE" && p.edited_video_url && (
                          <div className="rounded-xl overflow-hidden bg-black">
                            <video
                              src={toAbsoluteUrl(p.edited_video_url)}
                              controls
                              className="w-full max-h-[260px]"
                            />
                          </div>
                        )}

                        {p.status === "FAILED" && p.meta_data?.error && (
                          <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">
                            <AlertCircle size={13} className="flex-shrink-0" />
                            {String(p.meta_data.error)}
                          </div>
                        )}

                        {p.status === "DONE" && p.source_video_url && (
                          <div className="flex items-center gap-2">
                            <a
                              href={toAbsoluteUrl(p.source_video_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                            >
                              <Play size={11} /> Ver original
                            </a>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
