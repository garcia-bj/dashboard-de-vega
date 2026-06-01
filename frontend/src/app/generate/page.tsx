"use client";

import { useState } from "react";

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

  const handleGenerate = async () => {
    setLoading(true);
    setImageUrl(null);
    try {
      const res = await fetch("http://localhost:8000/api/publications/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ai_model: model }),
      });
      if (res.ok) {
        setImageUrl("/placeholder.png");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Generar Imagen</h1>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Modelo IA</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
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
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 resize-none"
              placeholder="Describe la imagen que quieres generar..."
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 rounded-lg py-3 font-semibold transition-colors"
          >
            {loading ? "Generando..." : "Generar Imagen"}
          </button>
        </div>

        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 flex items-center justify-center min-h-[400px]">
          {imageUrl ? (
            <img src={imageUrl} alt="Generated" className="max-w-full rounded-lg" />
          ) : (
            <p className="text-zinc-500">La imagen generada aparecerá aquí</p>
          )}
        </div>
      </div>
    </div>
  );
}
