"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import {
  Select, SelectContent, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {
  Sparkles, Wand2, ImageIcon,
  RefreshCw, X, CheckCircle2, AlertCircle,
  SlidersHorizontal, Eye, Loader2, Settings, Clock, Zap, UtensilsCrossed, Plus, Trash2,
  Pencil, Upload,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

const models = [
  {
    id: "openai",
    name: "OpenAI",
    provider: "IMAGE-2",
    sizes: ["1024x1024", "1024x1536 (Portrait)", "1536x1024 (Landscape)", "Auto"],
    showSize: true,
  },
  {
    id: "gemini",
    name: "Gemini",
    provider: "Google Imagen 3",
    sizes: [] as string[],
    showSize: false,
  },
];

const styles = ["Cinematográfico", "Minimalista", "Nocturno", "Cálido", "Gourmet", "Editorial", "Vintage", "Neón"];

interface MenuItem { id: number; name: string; price: string; }

interface PersonalizadoData {
  titulo: string;
  entradas: MenuItem[];
  segundos: MenuItem[];
  guarniciones: MenuItem[];
  bebidas: MenuItem[];
  postres: MenuItem[];
  precio_menu: string;
}

const EMPTY_PERSONALIZADO: PersonalizadoData = {
  titulo: "",
  entradas: [{ id: 1, name: "", price: "" }],
  segundos: [{ id: 1, name: "", price: "" }],
  guarniciones: [{ id: 1, name: "", price: "" }],
  bebidas: [{ id: 1, name: "", price: "" }],
  postres: [{ id: 1, name: "", price: "" }],
  precio_menu: "",
};

type Category = "entradas" | "segundos" | "guarniciones" | "bebidas" | "postres";

export default function GeneratePage() {
  const { logo, referenceImage } = useSettingsStore();
  const [topTab, setTopTab] = useState<"crear" | "editar">("crear");

  // ── Editar tab state ──
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState("");
  const [editGenerating, setEditGenerating] = useState(false);
  const [editResult, setEditResult] = useState<string | null>(null);
  const [editStorageUrl, setEditStorageUrl] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editProgress, setEditProgress] = useState(0);
  const [editProgressMsg, setEditProgressMsg] = useState("");
  const editProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const [model, setModel] = useState(models[0]);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState(models[0].sizes[1]);
  const [selStyles, setSelStyles] = useState<string[]>([]);
  const [mode, setMode] = useState<"libre" | "personalizado">("libre");
  const [personalizado, setPersonalizado] = useState<PersonalizadoData>(EMPTY_PERSONALIZADO);
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState("");
  const [result, setResult] = useState<string | null>(null);   // data_uri para display
  const [storageUrl, setStorageUrl] = useState<string | null>(null); // URL de storage para guardar
  const [error, setError] = useState("");
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const PROGRESS_STEPS = [
    { pct: 8,  msg: "Enviando prompt al modelo..." },
    { pct: 20, msg: "Procesando con IA..." },
    { pct: 40, msg: "Generando composición..." },
    { pct: 58, msg: "Aplicando estilos y detalles..." },
    { pct: 72, msg: "Renderizando imagen..." },
    { pct: 83, msg: "Optimizando resultado..." },
    { pct: 90, msg: "Casi listo..." },
  ];

  const startProgress = () => {
    setProgress(0);
    setProgressMsg("Iniciando generación...");
    let step = 0;
    progressRef.current = setInterval(() => {
      if (step < PROGRESS_STEPS.length) {
        setProgress(PROGRESS_STEPS[step].pct);
        setProgressMsg(PROGRESS_STEPS[step].msg);
        step++;
      }
    }, 2200);
  };

  const finishProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(100);
    setProgressMsg("¡Imagen generada!");
    setTimeout(() => { setProgress(0); setProgressMsg(""); }, 1200);
  };

  const resetProgress = () => {
    if (progressRef.current) clearInterval(progressRef.current);
    setProgress(0);
    setProgressMsg("");
  };

  useEffect(() => () => { if (progressRef.current) clearInterval(progressRef.current); }, []);
  useEffect(() => () => { if (editProgressRef.current) clearInterval(editProgressRef.current); }, []);

  const startEditProgress = () => {
    setEditProgress(0);
    setEditProgressMsg("Enviando imagen al modelo...");
    let step = 0;
    editProgressRef.current = setInterval(() => {
      if (step < PROGRESS_STEPS.length) {
        setEditProgress(PROGRESS_STEPS[step].pct);
        setEditProgressMsg(PROGRESS_STEPS[step].msg);
        step++;
      }
    }, 2200);
  };

  const finishEditProgress = () => {
    if (editProgressRef.current) clearInterval(editProgressRef.current);
    setEditProgress(100);
    setEditProgressMsg("¡Imagen editada!");
    setTimeout(() => { setEditProgress(0); setEditProgressMsg(""); }, 1200);
  };

  const resetEditProgress = () => {
    if (editProgressRef.current) clearInterval(editProgressRef.current);
    setEditProgress(0);
    setEditProgressMsg("");
  };

  const handleEditFile = (f: File) => {
    if (f.type !== "image/png") {
      toast.error("Solo se aceptan imágenes PNG para edición");
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      toast.error("La imagen no puede superar 4MB");
      return;
    }
    setEditFile(f);
    setEditPreviewUrl(URL.createObjectURL(f));
    setEditResult(null);
    setEditError("");
  };

  const handleEditGenerate = async () => {
    if (!editFile || !editPrompt.trim()) return;
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token) { toast.error("Sesión expirada"); return; }
    setEditGenerating(true);
    setEditResult(null);
    setEditError("");
    startEditProgress();
    try {
      const data = await api.publish.editImage(editFile, editPrompt.trim(), "1024x1024", token);
      const displayUrl = data.data_uri || toAbsoluteUrl(data.image_url || "");
      if (displayUrl) {
        finishEditProgress();
        setEditResult(displayUrl);
        setEditStorageUrl(data.image_url ? toAbsoluteUrl(data.image_url) : displayUrl);
        toast.success("Imagen editada");
      } else {
        resetEditProgress();
        setEditError("No se recibió imagen del servidor");
      }
    } catch (e) {
      resetEditProgress();
      setEditError(e instanceof Error ? e.message : "Error");
      toast.error(e instanceof Error ? e.message : "Error al editar");
    } finally {
      setEditGenerating(false);
    }
  };

  const handleEditAccept = async () => {
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token || (!editStorageUrl && !editResult)) return;
    setEditSaving(true);
    try {
      await api.publish.saveToGallery({
        image_url: editStorageUrl,
        data_uri: !editStorageUrl ? editResult : null,
        prompt: editPrompt,
        model: "openai",
      }, token);
      toast.success("Imagen guardada en galería");
      setEditResult(null);
      setEditStorageUrl(null);
      setEditPrompt("");
      setEditFile(null);
      setEditPreviewUrl(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setEditSaving(false); }
  };

  const enhanceInto = async (value: string, setValue: (v: string) => void) => {
    if (!value.trim()) return toast.error("Escribe un prompt para mejorar");
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token) { toast.error("Sesión expirada"); return; }
    setEnhancing(true);
    try {
      const data = await api.publish.enhancePrompt(value.trim(), token);
      setValue(data.enhanced_prompt);
      toast.success("Prompt mejorado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al mejorar el prompt");
    } finally {
      setEnhancing(false);
    }
  };

  const handleEnhance = () => enhanceInto(prompt, setPrompt);

  const addItem = (cat: Category) =>
    setPersonalizado((p) => ({ ...p, [cat]: [...p[cat], { id: Date.now(), name: "", price: "" }] }));

  const removeItem = (cat: Category, id: number) =>
    setPersonalizado((p) => ({ ...p, [cat]: p[cat].filter((x) => x.id !== id) }));

  const updateItem = (cat: Category, id: number, field: "name" | "price", value: string) =>
    setPersonalizado((p) => ({ ...p, [cat]: p[cat].map((x) => (x.id === id ? { ...x, [field]: value } : x)) }));

  const getEffectivePrompt = (): string | PersonalizadoData | null => {
    if (mode === "personalizado") {
      const hasTitle = personalizado.titulo.trim();
      const hasItems = [...personalizado.entradas, ...personalizado.segundos, ...personalizado.guarniciones, ...personalizado.bebidas, ...personalizado.postres].some((d) => d.name.trim());
      if (!hasTitle || !hasItems) return null;
      return {
        titulo: personalizado.titulo.trim(),
        entradas: personalizado.entradas.filter((d) => d.name.trim()),
        segundos: personalizado.segundos.filter((d) => d.name.trim()),
        guarniciones: personalizado.guarniciones.filter((d) => d.name.trim()),
        bebidas: personalizado.bebidas.filter((d) => d.name.trim()),
        postres: personalizado.postres.filter((d) => d.name.trim()),
        precio_menu: personalizado.precio_menu.trim(),
      };
    }
    return prompt.trim() || null;
  };

  const handleGenerate = async () => {
    const effectivePrompt = getEffectivePrompt();
    if (!effectivePrompt) {
      return toast.error(mode === "personalizado" ? "Completa el título y al menos un plato" : "Escribe un prompt");
    }
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token) { toast.error("Sesión expirada"); return; }
    setGenerating(true); setResult(null); setError("");
    startProgress();
    const body: Record<string, unknown> = mode === "personalizado"
      ? { ...(effectivePrompt as PersonalizadoData), model: model.id }
      : { prompt: effectivePrompt as string, model: model.id };
    if (selStyles.length) body.style = selStyles.join(", ");
    if (model.showSize && size) body.size = size.split(" ")[0];
    try {
      const data = await api.publish.generate(body, token);
      // Preferir data_uri para display (no depende de storage ni red)
      const displayUrl = data.data_uri || toAbsoluteUrl(data.image_url || "");
      if (displayUrl) {
        finishProgress();
        setResult(displayUrl);
        setStorageUrl(data.image_url ? toAbsoluteUrl(data.image_url) : displayUrl);
        toast.success("Imagen generada");
      } else {
        resetProgress();
        setError("No se recibió imagen del servidor");
        toast.warning("Respuesta inesperada del servidor");
      }
    } catch (e) {
      resetProgress();
      setError(e instanceof Error ? e.message : "Error");
      toast.error("Error al generar");
    } finally {
      setGenerating(false);
    }
  };

  const handleAccept = async () => {
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token || (!storageUrl && !result)) return;
    setSaving(true);
    try {
      const rawPrompt = getEffectivePrompt();
      const promptStr = mode === "personalizado" && rawPrompt ? JSON.stringify(rawPrompt) : ((rawPrompt as string) || "");
      await api.publish.saveToGallery({
        image_url: storageUrl,
        data_uri: !storageUrl ? result : null,
        prompt: promptStr,
        model: model.id,
      }, token);
      toast.success("Imagen guardada en galería");
      setResult(null); setStorageUrl(null); setPrompt(""); setPersonalizado(EMPTY_PERSONALIZADO); setSelStyles([]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  };

  const handleDiscard = () => {
    setResult(null); setStorageUrl(null); setError("");
    toast("Imagen descartada");
  };

  const CategorySection = ({ title, cat, items }: { title: string; cat: Category; items: MenuItem[] }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-semibold text-foreground/60 flex items-center gap-1.5">
          <UtensilsCrossed size={11} /> {title}
        </span>
        <button
          onClick={() => addItem(cat)}
          className="text-xs text-primary hover:text-primary/70 font-medium flex items-center gap-1"
        >
          <Plus size={11} /> Agregar
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1">Sin {title.toLowerCase()}</p>
      ) : (
        <div className="space-y-2">
          {items.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_80px_32px] gap-2 items-center">
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateItem(cat, row.id, "name", e.target.value)}
                placeholder="Nombre"
                className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
              <input
                type="text"
                value={row.price}
                onChange={(e) => updateItem(cat, row.id, "price", e.target.value)}
                placeholder="Precio"
                className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
              <button
                onClick={() => {
                  if (items.length > 1) removeItem(cat, row.id);
                  else { updateItem(cat, row.id, "name", ""); updateItem(cat, row.id, "price", ""); }
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                title="Eliminar"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const card = "rounded-2xl border border-border bg-card p-4 md:p-5";
  const fieldLabel = "text-xs font-semibold text-foreground/70 mb-2 block";

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Generar Imagen</h2>
          <p className="text-xs text-muted-foreground">Crea o edita imágenes con IA</p>
        </div>
        {!logo && topTab === "crear" && (
          <Link href="/settings">
            <button className="h-8 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5">
              <Settings size={13} /> Configurar logo
            </button>
          </Link>
        )}
      </div>

      {/* Top-level tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-border">
        <button
          onClick={() => setTopTab("crear")}
          className={cn(
            "flex-1 h-10 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
            topTab === "crear"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Wand2 size={14} /> Crear
        </button>
        <button
          onClick={() => setTopTab("editar")}
          className={cn(
            "flex-1 h-10 text-sm font-semibold transition-colors flex items-center justify-center gap-2",
            topTab === "editar"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <Pencil size={14} /> Editar
        </button>
      </div>

      {/* ── EDITAR TAB ── */}
      {topTab === "editar" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: upload + prompt */}
          <div className="lg:col-span-5 space-y-4">
            <div className={card}>
              <label className={fieldLabel}>Imagen PNG de referencia</label>
              <div
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleEditFile(f); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => editFileRef.current?.click()}
                className="rounded-2xl border-2 border-dashed border-border bg-muted flex flex-col items-center justify-center min-h-[160px] cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
              >
                {editPreviewUrl ? (
                  <div className="relative w-full">
                    <img src={editPreviewUrl} alt="Preview" className="w-full h-auto max-h-[200px] object-contain" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditFile(null); setEditPreviewUrl(null); }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:text-destructive transition-colors"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={26} className="text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Arrastrá una imagen PNG o hacé clic</p>
                    <p className="text-xs text-muted-foreground/50 mt-1">Solo PNG — máx. 4MB — cuadrada preferida</p>
                  </>
                )}
              </div>
              <input
                ref={editFileRef}
                type="file"
                accept="image/png"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleEditFile(f); }}
              />
            </div>

            <div className={card + " space-y-4"}>
              <div>
                <label className={fieldLabel}>Prompt de edición</label>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  rows={5}
                  placeholder="Describí los cambios: cambiar el fondo a un restaurante, ajustar colores, agregar texto..."
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
                <button
                  onClick={() => enhanceInto(editPrompt, setEditPrompt)}
                  disabled={enhancing || !editPrompt.trim()}
                  className="mt-2.5 w-full h-9 rounded-xl border border-secondary/40 text-xs font-semibold text-secondary hover:bg-secondary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  {enhancing
                    ? <><Loader2 size={13} className="animate-spin" /> Mejorando prompt...</>
                    : <><Zap size={13} /> Mejorar prompt con IA</>}
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border px-3 py-2.5">
                <Sparkles size={13} className="text-secondary flex-shrink-0" />
                <span className="text-xs font-semibold">OpenAI — gpt-image-1</span>
                <span className="text-xs text-muted-foreground ml-1">(único modelo con edición)</span>
              </div>
            </div>

            <button
              onClick={handleEditGenerate}
              disabled={editGenerating || !editFile || !editPrompt.trim()}
              className="w-full h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
            >
              {editGenerating
                ? <><Loader2 size={15} className="animate-spin" /> Editando...</>
                : <><Pencil size={15} /> Editar Imagen</>}
            </button>
          </div>

          {/* Right: result */}
          <div className="lg:col-span-7">
            <div className={card}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <Eye size={17} className="text-primary" /> Resultado
                </h3>
                {editResult && <Badge variant="success" className="gap-1"><CheckCircle2 size={10} />Editado</Badge>}
              </div>
              <div className="rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden min-h-[280px]">
                <AnimatePresence mode="wait">
                  {editGenerating ? (
                    <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5 w-full px-8">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                        className="w-12 h-12 rounded-full border-[3px] border-border border-t-primary" />
                      <div className="w-full space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{editProgressMsg}</span>
                          <span className="font-mono tabular-nums">{editProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
                            animate={{ width: `${editProgress}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Editando con OpenAI...</p>
                    </motion.div>
                  ) : editResult ? (
                    <motion.img key="img" src={editResult} alt="Edited"
                      initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                      className="w-full h-auto object-contain rounded-2xl" />
                  ) : editError ? (
                    <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 px-6 text-center">
                      <AlertCircle size={36} className="text-destructive/40" />
                      <p className="text-sm text-destructive">{editError}</p>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                      <ImageIcon size={36} className="text-muted-foreground/20" />
                      <p className="text-sm text-muted-foreground">La imagen editada aparecerá aquí</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {editResult && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => { setEditResult(null); setEditStorageUrl(null); setEditError(""); }}
                    className="flex-1 min-w-[90px] h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X size={14} /> Descartar
                  </button>
                  <button
                    onClick={handleEditGenerate}
                    disabled={editGenerating}
                    className="flex-1 min-w-[90px] h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <RefreshCw size={14} /> Reintentar
                  </button>
                  <button
                    onClick={handleEditAccept}
                    disabled={editSaving}
                    className="flex-1 min-w-[100px] h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
                  >
                    {editSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    {editSaving ? "Guardando..." : "Aceptar"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CREAR TAB ── */}
      {topTab === "crear" && <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Config panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Model */}
          <div className={card}>
            <label className={fieldLabel}>Modelo IA</label>
            <Select
              value={model.id}
              onValueChange={(v) => {
                const m = models.find((x) => x.id === v)!;
                setModel(m); setSize(m.sizes[1] ?? m.sizes[0] ?? "");
              }}
            >
              <SelectTrigger className="bg-muted border-border rounded-xl h-11">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-secondary flex-shrink-0" />
                  <span className="font-semibold text-sm">{model.name}</span>
                  <span className="text-muted-foreground text-xs">{model.provider}</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{m.provider}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Prompt */}
          <div className={card}>
            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-border mb-4">
              <button
                onClick={() => setMode("libre")}
                className={cn(
                  "flex-1 h-9 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                  mode === "libre"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Wand2 size={12} /> Prompt Libre
              </button>
              <button
                onClick={() => setMode("personalizado")}
                className={cn(
                  "flex-1 h-9 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5",
                  mode === "personalizado"
                    ? "bg-primary text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <UtensilsCrossed size={12} /> Personalizado
              </button>
            </div>

            {mode === "libre" ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <label className={fieldLabel}>Prompt</label>
                  <button onClick={() => setPrompt("")} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                    <X size={11} /> Limpiar
                  </button>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  placeholder="Describe la imagen: composición, iluminación, estilo, colores..."
                  className="w-full rounded-xl border border-border bg-muted px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
                <button
                  onClick={handleEnhance}
                  disabled={enhancing || !prompt.trim()}
                  className="mt-2.5 w-full h-9 rounded-xl border border-secondary/40 text-xs font-semibold text-secondary hover:bg-secondary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
                >
                  {enhancing
                    ? <><Loader2 size={13} className="animate-spin" /> Mejorando prompt...</>
                    : <><Zap size={13} /> Mejorar prompt con IA</>}
                </button>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className={fieldLabel}>Título del Menú</label>
                  <input
                    type="text"
                    value={personalizado.titulo}
                    onChange={(e) => setPersonalizado((p) => ({ ...p, titulo: e.target.value }))}
                    placeholder='Ej: Almuerzo Ejecutivo'
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>

                <CategorySection title="Entradas" cat="entradas" items={personalizado.entradas} />
                <CategorySection title="Segundos" cat="segundos" items={personalizado.segundos} />
                <CategorySection title="Guarniciones" cat="guarniciones" items={personalizado.guarniciones} />
                <CategorySection title="Bebidas" cat="bebidas" items={personalizado.bebidas} />
                <CategorySection title="Postres" cat="postres" items={personalizado.postres} />

                <div>
                  <label className={fieldLabel}>Precio del Menú</label>
                  <input
                    type="text"
                    value={personalizado.precio_menu}
                    onChange={(e) => setPersonalizado((p) => ({ ...p, precio_menu: e.target.value }))}
                    placeholder='Ej: 35 Bs'
                    className="w-full rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                  />
                </div>

                {mode === "personalizado" && getEffectivePrompt() && (
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 leading-relaxed max-h-32 overflow-y-auto">
                    <span className="text-foreground/50 font-mono block mb-1">JSON enviado:</span>
                    <pre className="font-mono whitespace-pre-wrap break-all">{JSON.stringify(getEffectivePrompt(), null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Size + Styles */}
          <div className={card + " space-y-4"}>
            {model.showSize && (
              <div>
                <label className={fieldLabel}>Tamaño</label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger className="bg-muted border-border rounded-xl h-11">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal size={13} className="flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm">{size}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {model.sizes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <label className={fieldLabel}>Estilo Visual</label>
              <div className="flex flex-wrap gap-1.5">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelStyles((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                      selStyles.includes(s)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>

          {logo && referenceImage ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={15} />
              Logo + Referencia incluidos
            </div>
          ) : (
            <Link href="/settings" className="block">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3 flex items-center gap-2 text-sm text-amber-400 hover:bg-amber-500/15 transition-colors cursor-pointer">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>
                  {!logo && !referenceImage
                    ? <><span className="font-semibold">Logo e imagen de referencia requeridos</span> — subílos en Configuración</>
                    : !logo
                    ? <><span className="font-semibold">Logo requerido</span> — subí tu logo en Configuración</>
                    : <><span className="font-semibold">Imagen de referencia requerida</span> — subí una imagen de referencia en Configuración</>
                  }
                </span>
                <Settings size={13} className="ml-auto flex-shrink-0" />
              </div>
            </Link>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => { setPrompt(""); setSelStyles([]); setResult(null); setPersonalizado(EMPTY_PERSONALIZADO); }}
              className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> Reiniciar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !getEffectivePrompt() || !logo || !referenceImage}
              className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
            >
              {generating
                ? <><Loader2 size={15} className="animate-spin" /> Generando...</>
                : <><Wand2 size={15} /> Generar Imagen</>}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className={card}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Eye size={17} className="text-primary" /> Vista Previa
              </h3>
              {result && <Badge variant="success" className="gap-1"><CheckCircle2 size={10} />Generado</Badge>}
            </div>
            <div className="rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden min-h-[280px]">
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-5 w-full px-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                      className="w-12 h-12 rounded-full border-[3px] border-border border-t-primary" />
                    <div className="w-full space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progressMsg}</span>
                        <span className="font-mono tabular-nums">{progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">Generando con {model.provider}...</p>
                  </motion.div>
                ) : result ? (
                  <motion.img key="img" src={result} alt="Generated"
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-auto object-contain rounded-2xl" />
                ) : error ? (
                  <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2 px-6 text-center">
                    <AlertCircle size={36} className="text-destructive/40" />
                    <p className="text-sm text-destructive">{error}</p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                    <ImageIcon size={36} className="text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">La imagen aparecerá aquí</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {result && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                <button
                  onClick={handleDiscard}
                  className="flex-1 min-w-[90px] h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors flex items-center justify-center gap-1.5"
                >
                  <X size={14} /> Descartar
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex-1 min-w-[90px] h-10 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <RefreshCw size={14} /> Reiniciar
                </button>
                <button
                  onClick={handleAccept}
                  disabled={saving}
                  className="flex-1 min-w-[100px] h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {saving ? "Guardando..." : "Aceptar"}
                </button>
              </div>
            )}
          </div>

          <div className={card}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Clock size={16} className="text-muted-foreground" /> Recientes
              </h3>
              <Link href="/media">
                <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Ver galería →</span>
              </Link>
            </div>
            <div className="rounded-xl border border-dashed border-border p-6 flex items-center gap-3 text-sm text-muted-foreground justify-center">
              <ImageIcon size={16} className="opacity-40" /> Sin generaciones — crea tu primera imagen
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
