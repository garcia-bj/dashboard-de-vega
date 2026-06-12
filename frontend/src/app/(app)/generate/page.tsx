"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api";
import {
  Sparkles, Wand2, ImageIcon, CalendarDays, Share2, Download,
  RefreshCw, ChevronDown, X, CheckCircle2, AlertCircle,
  SlidersHorizontal, Eye, Loader2, Settings, Clock,
} from "lucide-react";

const models = [
  { id: "gemini", name: "Imagen 3", provider: "Google Gemini", sizes: ["1024x1024", "1024x1792", "1792x1024"] },
  { id: "openai_dalle", name: "DALL·E 3", provider: "OpenAI", sizes: ["1024x1024", "1024x1792", "1792x1024"] },
  { id: "openrouter_flux", name: "Flux 1.1 Pro", provider: "OpenRouter", sizes: ["1024x1024", "1024x1536", "1536x1024"] },
  { id: "openrouter_sd", name: "Stable Diffusion XL", provider: "OpenRouter", sizes: ["1024x1024", "896x1152", "1152x896"] },
];

const styles = ["Cinematográfico", "Minimalista", "Nocturno", "Cálido", "Gourmet", "Editorial", "Vintage", "Neón"];

export default function GeneratePage() {
  const { logo, referenceImage } = useSettingsStore();
  const [model, setModel] = useState(models[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [negPrompt, setNegPrompt] = useState("");
  const [size, setSize] = useState(models[0].sizes[0]);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [selStyles, setSelStyles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return toast.error("Escribe un prompt");
    const token = useAuthStore.getState().token || localStorage.getItem("token");
    if (!token) { toast.error("Sesión expirada — vuelve a iniciar sesión"); return; }
    setGenerating(true); setResult(null); setError("");
    const body: Record<string, string> = { prompt: prompt.trim(), model: model.id };
    if (selStyles.length) body.style = selStyles.join(", ");
    if (size) body.size = size;
    if (negPrompt.trim()) body.negative_prompt = negPrompt.trim();
    try {
      const data = await api.publish.generate(body, token);
      const url = data.image_url;
      if (url?.startsWith("http")) { setResult(url); toast.success("Imagen generada"); }
      else { setError("Sin URL en respuesta"); toast.warning("Respuesta inesperada del servidor"); }
    } catch (e) { setError(e instanceof Error ? e.message : "Error"); toast.error("Error al generar"); }
    finally { setGenerating(false); }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div><h2 className="text-2xl font-semibold">Generar Imagen</h2><p className="text-sm text-muted-foreground">Crea con IA, tu logo y estilo</p></div>
        {!logo && <Link href="/settings"><Button variant="outline" size="sm" className="gap-2"><Settings size={14} /> Configurar logo</Button></Link>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Config */}
        <div className="lg:col-span-5 space-y-4">
          {/* Model */}
          <div className="rounded-md border bg-card p-4">
            <label className="text-xs font-semibold mb-2 block">Modelo IA</label>
            <div className="relative">
              <button onClick={() => setModelOpen(!modelOpen)} className="w-full h-10 rounded-md border px-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><Sparkles size={16} className="text-secondary" /><span className="font-medium">{model.name}</span><span className="text-muted-foreground text-xs">{model.provider}</span></div>
                <ChevronDown size={14} className={cn("transition-transform", modelOpen && "rotate-180")} />
              </button>
              <AnimatePresence>{modelOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-20 overflow-hidden">
                  {models.map((m) => (
                    <button key={m.id} onClick={() => { setModel(m); setSize(m.sizes[0]); setModelOpen(false); }} className={cn("w-full text-left p-3 hover:bg-accent text-sm", m.id === model.id && "bg-accent")}>
                      <p className="font-medium">{m.name}</p><p className="text-xs text-muted-foreground">{m.provider}</p>
                    </button>
                  ))}
                </motion.div>
              )}</AnimatePresence>
            </div>
          </div>

          {/* Prompt */}
          <div className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold">Prompt</label>
              <button onClick={() => setPrompt("")} className="text-xs text-muted-foreground hover:text-destructive"><X size={12} /> Limpiar</button>
            </div>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} placeholder="Describe la imagen: composición, iluminación, estilo..." />
            <label className="text-xs font-semibold mt-3 mb-1 block">Prompt Negativo</label>
            <Textarea value={negPrompt} onChange={(e) => setNegPrompt(e.target.value)} rows={2} placeholder="Elementos a excluir..." />
          </div>

          {/* Size + Styles */}
          <div className="rounded-md border bg-card p-4 space-y-4">
            <div>
              <label className="text-xs font-semibold mb-2 block">Tamaño</label>
              <div className="relative">
                <button onClick={() => setSizeOpen(!sizeOpen)} className="w-full h-10 rounded-md border px-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><SlidersHorizontal size={14} />{size}</span>
                  <ChevronDown size={14} className={cn("transition-transform", sizeOpen && "rotate-180")} />
                </button>
                <AnimatePresence>{sizeOpen && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="absolute top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md z-20 overflow-hidden">
                    {model.sizes.map((s) => <button key={s} onClick={() => { setSize(s); setSizeOpen(false); }} className={cn("w-full text-left px-3 py-2 text-sm hover:bg-accent", s === size && "bg-accent font-medium")}>{s}</button>)}
                  </motion.div>
                )}</AnimatePresence>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold mb-2 block">Estilo Visual</label>
              <div className="flex flex-wrap gap-1.5">
                {styles.map((s) => (
                  <Badge key={s} variant={selStyles.includes(s) ? "default" : "outline"} className="cursor-pointer" onClick={() => setSelStyles((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])}>{s}</Badge>
                ))}
              </div>
            </div>
          </div>

          {(logo || referenceImage) && (
            <div className="rounded-md border bg-card p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 size={16} className="text-green-600" />
              {logo && "Logo "}{logo && referenceImage && "+ "}{referenceImage && "Referencia "}incluidos
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => { setPrompt(""); setNegPrompt(""); setSelStyles([]); setResult(null); }}><RefreshCw size={14} /> Reiniciar</Button>
            <Button className="flex-1 gap-2" onClick={handleGenerate} disabled={generating || !prompt.trim()}>
              {generating ? <><Loader2 size={16} className="animate-spin" /> Generando...</> : <><Wand2 size={16} /> Generar Imagen</>}
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Eye size={18} className="text-primary" /> Vista Previa</h3>
              {result && <Badge variant="success" className="gap-1"><CheckCircle2 size={12} /> Generado</Badge>}
            </div>
            <div className="aspect-square rounded-md bg-muted flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-muted-foreground/20 border-t-primary" />
                    <p className="text-sm">Generando con {model.provider}...</p>
                  </motion.div>
                ) : result ? (
                  <motion.img key="img" src={result} alt="Generated" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full object-cover" />
                ) : error ? (
                  <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2"><AlertCircle size={40} className="text-destructive/40" /><p className="text-sm text-destructive text-center px-4">{error}</p></motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2"><ImageIcon size={40} className="text-muted-foreground/30" /><p className="text-sm text-muted-foreground">La imagen aparecerá aquí</p></motion.div>
                )}
              </AnimatePresence>
            </div>
            {result && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="gap-1 flex-1"><Download size={14} />Descargar</Button>
                <Link href="/schedule"><Button variant="outline" size="sm" className="gap-1 flex-1"><CalendarDays size={14} />Programar</Button></Link>
                <Button size="sm" className="gap-1 flex-1"><Share2 size={14} />Publicar</Button>
              </div>
            )}
          </div>

          <div className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2"><Clock size={16} /> Recientes</h3>
              <Link href="/media"><Button variant="link" size="sm">Ver galería</Button></Link>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
              <ImageIcon size={18} /> Sin generaciones aún — crea tu primera imagen
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
