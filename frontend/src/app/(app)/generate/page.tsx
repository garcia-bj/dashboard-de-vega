"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  ImageIcon,
  CalendarDays,
  Share2,
  Download,
  Copy,
  RefreshCw,
  ChevronDown,
  Plus,
  Clock,
  X,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Eye,
} from "lucide-react";

type AIModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  sizes: string[];
};

const models: AIModel[] = [
  {
    id: "gemini",
    name: "Imagen 3",
    provider: "Google Gemini",
    description: "Generación fotorrealista de alta calidad con control avanzado de estilo",
    sizes: ["1024x1024", "1024x1792", "1792x1024"],
  },
  {
    id: "openai_dalle",
    name: "DALL·E 3",
    provider: "OpenAI",
    description: "Generación creativa con excelente comprensión de prompts complejos",
    sizes: ["1024x1024", "1024x1792", "1792x1024"],
  },
  {
    id: "openrouter_flux",
    name: "Flux 1.1 Pro",
    provider: "OpenRouter",
    description: "Modelo de última generación con calidad excepcional en detalles finos",
    sizes: ["1024x1024", "1024x1536", "1536x1024"],
  },
  {
    id: "openrouter_sd",
    name: "Stable Diffusion XL",
    provider: "OpenRouter",
    description: "Versátil y rápido, ideal para iteraciones y experimentación",
    sizes: ["1024x1024", "896x1152", "1152x896"],
  },
];

const stylePresets = [
  "Cinematográfico", "Minimalista", "Nocturno", "Cálido",
  "Gourmet", "Editorial", "Vintage", "Neón",
];

const recentGenerations = [
  {
    id: "1",
    prompt: "Plato gourmet con luces de neón",
    model: "Gemini",
    status: "completed" as const,
    time: "Hace 5 min",
  },
  {
    id: "2",
    prompt: "Cóctel artesanal frutas tropicales",
    model: "DALL·E 3",
    status: "completed" as const,
    time: "Hace 2h",
  },
  {
    id: "3",
    prompt: "Terraza al atardecer tonos ca...",
    model: "Flux",
    status: "failed" as const,
    time: "Hace 3h",
  },
];

export default function GeneratePage() {
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [modelOpen, setModelOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [size, setSize] = useState(models[0].sizes[0]);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const toggleStyle = (style: string) => {
    setSelectedStyles((prev) =>
      prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedImage(null);
    await new Promise((r) => setTimeout(r, 2500));
    setGenerating(false);
    setGeneratedImage("/placeholder-image.svg");
  };

  const handleReset = () => {
    setPrompt("");
    setNegativePrompt("");
    setSelectedStyles([]);
    setGeneratedImage(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-headline-lg text-on-surface">Generar Imagen</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Crea imágenes con IA usando los mejores modelos del mercado
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left - Config Panel (5/12) */}
        <div className="col-span-5 space-y-5">
          {/* Model Selector */}
          <div className="card p-5">
            <label className="block text-label-sm text-on-surface mb-3">Modelo IA</label>
            <div className="relative">
              <button
                onClick={() => setModelOpen(!modelOpen)}
                className="w-full input-field flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center">
                    <Sparkles size={18} className="text-secondary-dark" />
                  </div>
                  <div>
                    <p className="text-body-md text-on-surface font-medium">{selectedModel.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{selectedModel.provider}</p>
                  </div>
                </div>
                <ChevronDown size={16} className={`transition-transform ${modelOpen ? "rotate-180" : ""}`} />
              </button>

              {modelOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-20 overflow-hidden">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setSize(model.sizes[0]);
                        setModelOpen(false);
                      }}
                      className={`w-full text-left p-4 hover:bg-surface-container transition-colors ${
                        model.id === selectedModel.id
                          ? "bg-primary-fixed"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-secondary-fixed flex items-center justify-center flex-shrink-0">
                          <Sparkles size={18} className="text-secondary-dark" />
                        </div>
                        <div>
                          <p className="text-body-md text-on-surface font-medium">{model.name}</p>
                          <p className="text-label-sm text-on-surface-variant">{model.provider}</p>
                          <p className="text-label-sm text-on-surface-variant mt-0.5">{model.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Prompt */}
          <div className="card p-5">
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
              placeholder="Describe la imagen que quieres generar con detalle: estilo, composición, iluminación, colores..."
              className="input-field resize-none"
            />

            <div className="mt-4">
              <label className="block text-label-sm text-on-surface mb-2">
                Prompt Negativo (opcional)
              </label>
              <textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                rows={2}
                placeholder="Elementos que NO quieres incluir en la imagen..."
                className="input-field resize-none text-body-md"
              />
            </div>
          </div>

          {/* Size + Style */}
          <div className="card p-5">
            {/* Size */}
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
                {sizeOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-20 overflow-hidden">
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
                  </div>
                )}
              </div>
            </div>

            {/* Style Presets */}
            <div>
              <label className="block text-label-sm text-on-surface mb-3">Estilo Visual</label>
              <div className="flex flex-wrap gap-2">
                {stylePresets.map((style) => (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`px-3.5 py-2 rounded-full text-body-md transition-colors ${
                      selectedStyles.includes(style)
                        ? "bg-primary text-white"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="btn-tertiary flex items-center gap-2">
              <RefreshCw size={16} />
              Reiniciar
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
            >
              {generating ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  Generar Imagen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right - Preview Area (7/12) */}
        <div className="col-span-7 space-y-5">
          {/* Main Preview */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md text-on-surface flex items-center gap-2">
                <Eye size={20} className="text-primary" /> Vista Previa
              </h3>
              {generatedImage && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-label-sm">
                  <CheckCircle2 size={14} />
                  Generado
                </span>
              )}
            </div>

            <div className="aspect-square rounded-lg bg-surface-container flex items-center justify-center overflow-hidden relative">
              {generating ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-surface-container-high border-t-primary animate-spin" />
                    <Sparkles size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-body-md text-on-surface font-medium">Generando imagen...</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      Esto puede tomar unos segundos
                    </p>
                  </div>
                </div>
              ) : generatedImage ? (
                <div className="w-full h-full bg-gradient-to-br from-tertiary via-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles size={64} className="text-primary/40 mx-auto mb-4" />
                    <p className="text-body-md text-on-surface font-medium">Imagen generada con {selectedModel.name}</p>
                    <p className="text-label-sm text-on-surface-variant mt-1 max-w-md truncate px-4">{prompt}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <ImageIcon size={48} className="text-on-surface-variant opacity-30" />
                  <p className="text-body-md text-on-surface-variant">
                    La imagen generada aparecerá aquí
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    Escribe un prompt y presiona Generar
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {generatedImage && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant">
                <button className="btn-secondary flex items-center gap-2 flex-1">
                  <Download size={16} />
                  Descargar
                </button>
                <button className="btn-secondary flex items-center gap-2 flex-1">
                  <CalendarDays size={16} />
                  Programar
                </button>
                <button className="btn-primary flex items-center gap-2 flex-1">
                  <Share2 size={16} />
                  Publicar
                </button>
              </div>
            )}
          </div>

          {/* Recent Generations */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md text-on-surface flex items-center gap-2">
                <Clock size={20} className="text-on-surface-variant" />
                Generaciones Recientes
              </h3>
              <Link href="/media" className="text-label-sm text-primary hover:text-primary-hover">
                Ver galería
              </Link>
            </div>

            <div className="space-y-2">
              {recentGenerations.map((gen) => (
                <div
                  key={gen.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-low transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                    {gen.status === "completed" ? (
                      <ImageIcon size={18} className="text-on-surface-variant" />
                    ) : (
                      <AlertCircle size={18} className="text-error" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md text-on-surface truncate">{gen.prompt}</p>
                    <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                      <span>{gen.model}</span>
                      <span>·</span>
                      <span>{gen.time}</span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${
                      gen.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-error-container text-error"
                    }`}
                  >
                    {gen.status === "completed" && <CheckCircle2 size={11} />}
                    {gen.status === "failed" && <AlertCircle size={11} />}
                    {gen.status === "completed" ? "Listo" : "Error"}
                  </span>
                </div>
              ))}

              <button className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-outline-variant hover:border-primary/30 text-on-surface-variant hover:text-primary transition-colors">
                <Plus size={16} />
                <span className="text-body-md">Nueva Generación</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
