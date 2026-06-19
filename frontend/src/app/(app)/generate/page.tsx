"use client";

import { useState } from "react";
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
  Sparkles, Wand2, ImageIcon, CalendarDays, Share2, Download,
  RefreshCw, X, CheckCircle2, AlertCircle,
  SlidersHorizontal, Eye, Loader2, Settings, Clock, Zap,
} from "lucide-react";

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

export default function GeneratePage() {
  const { logo, referenceImage } = useSettingsStore();
  const [model, setModel] = useState(models[0]);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState(models[0].sizes[2]);
  const [selStyles, setSelStyles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleEnhance = async () => {
    if (!prompt.trim()) return toast.error("Escribe un prompt para mejorar");
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token) { toast.error("Sesión expirada"); return; }
    setEnhancing(true);
    try {
      const data = await api.publish.enhancePrompt(prompt.trim(), token);
      setPrompt(data.enhanced_prompt);
      toast.success("Prompt mejorado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al mejorar el prompt");
    } finally {
      setEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Escribe un prompt");
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token) { toast.error("Sesión expirada"); return; }
    setGenerating(true); setResult(null); setError("");
    const body: Record<string, string> = { prompt: prompt.trim(), model: model.id };
    if (selStyles.length) body.style = selStyles.join(", ");
    if (model.showSize && size) body.size = size.split(" ")[0];
    try {
      const data = await api.publish.generate(body, token);
      const url = data.image_url;
      if (url?.startsWith("http")) { setResult(url); toast.success("Imagen generada"); }
      else { setError("Sin URL en respuesta"); toast.warning("Respuesta inesperada"); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      toast.error("Error al generar");
    } finally {
      setGenerating(false);
    }
  };

  const card = "rounded-2xl border border-border bg-card p-5";
  const fieldLabel = "text-xs font-semibold text-foreground/70 mb-2 block";

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Generar Imagen</h2>
          <p className="text-xs text-muted-foreground">Crea con IA, tu logo y estilo</p>
        </div>
        {!logo && (
          <Link href="/settings">
            <button className="h-8 px-3 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-1.5">
              <Settings size={13} /> Configurar logo
            </button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Config panel */}
        <div className="lg:col-span-5 space-y-4">
          {/* Model */}
          <div className={card}>
            <label className={fieldLabel}>Modelo IA</label>
            <Select
              value={model.id}
              onValueChange={(v) => {
                const m = models.find((x) => x.id === v)!;
                setModel(m); setSize(m.sizes[2] ?? m.sizes[0] ?? "");
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
              onClick={() => { setPrompt(""); setSelStyles([]); setResult(null); }}
              className="h-10 px-4 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2"
            >
              <RefreshCw size={14} /> Reiniciar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim() || !logo || !referenceImage}
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
            <div className="aspect-square rounded-2xl bg-muted border border-border flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
                      className="w-14 h-14 rounded-full border-[3px] border-border border-t-primary" />
                    <p className="text-sm text-muted-foreground">Generando con {model.provider}...</p>
                  </motion.div>
                ) : result ? (
                  <motion.img key="img" src={result} alt="Generated"
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full object-cover" />
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
                <button className="flex-1 h-9 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
                  <Download size={14} /> Descargar
                </button>
                <Link href="/schedule" className="flex-1">
                  <button className="w-full h-9 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center gap-1.5">
                    <CalendarDays size={14} /> Programar
                  </button>
                </Link>
                <button className="flex-1 h-9 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-1.5"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
                  <Share2 size={14} /> Publicar
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
      </div>
    </div>
  );
}
