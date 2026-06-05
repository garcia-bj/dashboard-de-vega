"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  Wand2,
  ImageIcon,
  CalendarDays,
  Share2,
  Download,
  RefreshCw,
  ChevronDown,
  Plus,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Eye,
  Loader2,
  ArrowUpRight,
  Settings,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";

type AIModel = {
  id: string;
  name: string;
  provider: string;
  sizes: string[];
};

const models: AIModel[] = [
  {
    id: "gemini",
    name: "Imagen 3",
    provider: "Google Gemini",
    sizes: ["1024x1024", "1024x1792", "1792x1024"],
  },
  {
    id: "openai_dalle",
    name: "DALL·E 3",
    provider: "OpenAI",
    sizes: ["1024x1024", "1024x1792", "1792x1024"],
  },
  {
    id: "openrouter_flux",
    name: "Flux 1.1 Pro",
    provider: "OpenRouter",
    sizes: ["1024x1024", "1024x1536", "1536x1024"],
  },
  {
    id: "openrouter_sd",
    name: "Stable Diffusion XL",
    provider: "OpenRouter",
    sizes: ["1024x1024", "896x1152", "1152x896"],
  },
];

const stylePresets = [
  "Cinematográfico", "Minimalista", "Nocturno", "Cálido",
  "Gourmet", "Editorial", "Vintage", "Neón",
];

const WEBHOOK_URL = "https://asc-n8n.autosalescloser.com/webhook/img_asd";

export default function GeneratePage() {
  const { logo, referenceImage } = useSettingsStore();
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [size, setSize] = useState(models[0].sizes[0]);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Escribe un prompt primero");
      return;
    }
    if (!logo) {
      toast("No hay logo configurado", {
        description: "Sube un logo en Configuración para mejores resultados",
        action: { label: "Ir a Config", onClick: () => window.location.href = "/settings" },
      });
    }

    setGenerating(true);
    setGeneratedImage(null);
    setErrorMsg("");

    const body: Record<string, string> = {
      prompt: prompt.trim(),
      model: selectedModel.id,
    };

    if (selectedStyles.length > 0) {
      body.style = selectedStyles.join(", ");
    }
    if (size) body.size = size;
    if (negativePrompt.trim()) body.negative_prompt = negativePrompt.trim();
    if (logo) body.logo = logo;
    if (referenceImage) body.reference_image = referenceImage;

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();

      const imageUrl =
        data.image_url ||
        data.url ||
        data.output ||
        data.result?.image ||
        data.data?.url ||
        JSON.stringify(data);

      if (imageUrl && imageUrl.startsWith("http")) {
        setGeneratedImage(imageUrl);
        toast.success("Imagen generada con éxito");
      } else {
        setErrorMsg("Webhook respondió pero sin URL de imagen");
        toast.warning("Respuesta inesperada del servidor");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      setErrorMsg(msg);
      toast.error("Error al generar la imagen", { description: msg });
    } finally {
      setGenerating(false);
    }
  };

  const handleReset = () => {
    setPrompt("");
    setNegativePrompt("");
    setSelectedStyles([]);
    setGeneratedImage(null);
    setErrorMsg("");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-headline-lg text-on-surface"
          >
            Generar Imagen
          </motion.h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Crea imágenes con IA usando los mejores modelos, con tu logo y estilo
          </p>
        </div>
        {!logo && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 rounded bg-surface-container text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <Settings size={16} />
              Configurar logo + referencia
              <ArrowUpRight size={14} />
            </Link>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left - Config Panel */}
        <div className="col-span-5 space-y-5">
          {/* Model Selector */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card p-5"
          >
            <label className="block text-label-sm text-on-surface mb-3">Modelo IA</label>
            <div className="relative">
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="w-full input-field flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-secondary-fixed flex items-center justify-center">
                    <Sparkles size={18} className="text-secondary-dark" />
                  </div>
                  <div>
                    <p className="text-body-md text-on-surface font-medium">{selectedModel.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{selectedModel.provider}</p>
                  </div>
                </div>
                <ChevronDown size={16} className={`transition-transform ${modelOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {modelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                    animate={{ opacity: 1, y: 0, scaleY: 1 }}
                    exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/5 rounded shadow-xl z-20 overflow-hidden origin-top"
                  >
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model);
                          setSize(model.sizes[0]);
                          setModelOpen(false);
                        }}
                        className={`w-full text-left p-4 hover:bg-surface-container transition-colors ${
                          model.id === selectedModel.id ? "bg-primary-fixed" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-secondary-fixed flex items-center justify-center flex-shrink-0">
                            <Sparkles size={18} className="text-secondary-dark" />
                          </div>
                          <div>
                            <p className="text-body-md text-on-surface font-medium">{model.name}</p>
                            <p className="text-label-sm text-on-surface-variant">{model.provider}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Prompt */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <label className="text-label-sm text-on-surface">Prompt</label>
              <button
                onClick={() => setPrompt("")}
                className="text-label-sm text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
              >
                <X size={14} /> Limpiar
              </button>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Describe la imagen que quieres generar con detalle: composición, iluminación, colores, estilo..."
              className="input-field resize-none"
            />

            <div className="mt-4">
              <label className="block text-label-sm text-on-surface mb-2">Prompt Negativo (opcional)</label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                placeholder="Elementos que NO quieres incluir..."
                className="input-field resize-none text-body-md"
              />
            </div>
          </motion.div>

          {/* Size + Style */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-5"
          >
            <div className="mb-5">
              <label className="block text-label-sm text-on-surface mb-3">Tamaño</label>
              <div className="relative">
                <button
                  onClick={() => setSizeOpen(!sizeOpen)}
                  className="w-full input-field flex items-center justify-between text-left"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-on-surface-variant" />
                    <span className="text-body-md text-on-surface">{size}</span>
                  </span>
                  <ChevronDown size={16} className={`transition-transform ${sizeOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {sizeOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
                      animate={{ opacity: 1, y: 0, scaleY: 1 }}
                      exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/5 rounded shadow-xl z-20 overflow-hidden origin-top"
                    >
                      {selectedModel.sizes.map((s) => (
                        <button
                          key={s}
                          onClick={() => { setSize(s); setSizeOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container transition-colors ${
                            s === size ? "bg-primary-fixed text-primary-dark font-medium" : "text-on-surface"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div>
              <label className="block text-label-sm text-on-surface mb-3">Estilo Visual</label>
              <div className="flex flex-wrap gap-2">
                {stylePresets.map((style) => (
                  <motion.button
                    key={style}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => toggleStyle(style)}
                    className={`px-3.5 py-2 rounded-full text-body-md transition-colors ${
                      selectedStyles.includes(style)
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {style}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Logo + Ref indicators */}
          {(logo || referenceImage) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 flex items-center gap-3"
            >
              <CheckCircle2 size={18} className="text-green-600" />
              <div className="text-body-md text-on-surface-variant">
                {logo && <span className="text-on-surface font-medium">Logo </span>}
                {logo && referenceImage && <span className="text-on-surface-variant">+ </span>}
                {referenceImage && <span className="text-on-surface font-medium">Referencia </span>}
                incluidos en la solicitud
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="btn-tertiary flex items-center gap-2">
              <RefreshCw size={16} />
              Reiniciar
            </button>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Generar Imagen
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Right - Preview */}
        <div className="col-span-7 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md text-on-surface flex items-center gap-2">
                <Eye size={20} className="text-primary" /> Vista Previa
              </h3>
              <AnimatePresence>
                {generatedImage && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-label-sm"
                  >
                    <CheckCircle2 size={14} />
                    Generado
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="aspect-square rounded bg-surface-container flex items-center justify-center overflow-hidden relative">
              <AnimatePresence mode="wait">
                {generating ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      className="w-20 h-20 rounded-full border-4 border-surface-container-high border-t-primary"
                    />
                    <div className="text-center">
                      <p className="text-body-md text-on-surface font-medium">Generando imagen...</p>
                      <p className="text-label-sm text-on-surface-variant mt-0.5">
                        Enviando a {selectedModel.provider}
                      </p>
                    </div>
                  </motion.div>
                ) : generatedImage ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full bg-gradient-to-br from-tertiary via-primary/10 to-secondary/10 flex items-center justify-center"
                  >
                    <img
                      src={generatedImage}
                      alt="Generated"
                      className="w-full h-full object-cover"
                      onError={() => toast.error("No se pudo cargar la imagen generada")}
                    />
                  </motion.div>
                ) : errorMsg ? (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <AlertCircle size={48} className="text-error/40" />
                    <p className="text-body-md text-error max-w-sm text-center">{errorMsg}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <ImageIcon size={48} className="text-on-surface-variant opacity-30" />
                    <p className="text-body-md text-on-surface-variant">
                      La imagen generada aparecerá aquí
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      Webhook: {WEBHOOK_URL}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {generatedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant"
                >
                  <button className="btn-secondary flex items-center gap-2 flex-1">
                    <Download size={16} />
                    Descargar
                  </button>
                  <Link href="/schedule" className="btn-secondary flex items-center gap-2 flex-1">
                    <CalendarDays size={16} />
                    Programar
                  </Link>
                  <button className="btn-primary flex items-center gap-2 flex-1">
                    <Share2 size={16} />
                    Publicar
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Recent Quick */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md text-on-surface flex items-center gap-2">
                <Clock size={20} className="text-on-surface-variant" />
                Recientes
              </h3>
              <Link href="/media" className="text-label-sm text-primary hover:text-primary-hover">
                Ver galería
              </Link>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded hover:bg-surface-low transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center flex-shrink-0">
                  <ImageIcon size={18} className="text-on-surface-variant" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-surface truncate">Sin generaciones aún</p>
                  <p className="text-label-sm text-on-surface-variant">Crea tu primera imagen</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
