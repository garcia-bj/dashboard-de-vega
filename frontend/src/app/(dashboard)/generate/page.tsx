"use client";

import { useState } from "react";
import { useAuthStore } from "../../../store/auth";
import { api } from "../../../lib/api";

const MODELS = [
  { value: "gemini", label: "Gemini (Imagen 3)" },
  { value: "openai_dalle", label: "OpenAI (DALL·E 3)" },
  { value: "openrouter_flux", label: "OpenRouter (Flux)" },
  { value: "openrouter_stable_diffusion", label: "OpenRouter (Stable Diffusion)" },
];

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gemini");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  const handleGenerate = async () => {
    if (!token) {
      setError("No has iniciado sesión.");
      return;
    }
    setLoading(true);
    setImageUrl(null);
    setStatusMessage(null);
    setError(null);
    
    try {
      const response = await api.publications.generate(
        { prompt, ai_model: model },
        token
      ) as { detail?: string };
      
      setStatusMessage(response.detail || "Petición enviada con éxito.");
      setImageUrl("/placeholder.png");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Error al solicitar la generación de imagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Generar Imagen</h1>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-5">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}
          {statusMessage && (
            <div className="bg-green-900/30 border border-green-800 text-green-300 rounded-lg p-4 text-sm">
              {statusMessage}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Modelo IA</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-brand-500"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 resize-none focus:outline-none focus:border-brand-500"
              placeholder="Describe la imagen que quieres generar..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg py-3 font-semibold transition-colors text-white"
          >
            {loading ? "Generando..." : "Generar Imagen"}
          </button>
        </div>

        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex flex-col items-center justify-center min-h-[400px]">
          {imageUrl ? (
            <div className="text-center space-y-4">
              <div className="h-40 w-40 mx-auto bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                <span className="text-zinc-500 text-sm">Procesando...</span>
              </div>
              <p className="text-zinc-400 text-sm max-w-xs">
                La generación asíncrona se ha iniciado. Podrás ver la imagen en la sección Media una vez completada.
              </p>
            </div>
          ) : (
            <p className="text-zinc-500">La imagen generada aparecerá aquí</p>
          )}
        </div>
      </div>
    </div>
  );
}
