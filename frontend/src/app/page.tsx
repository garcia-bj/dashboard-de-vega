import Link from "next/link";
import { Wand2, Calendar, BarChart3 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-tertiary flex flex-col items-center justify-center gap-10 p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white tracking-tight mb-3">De Vega</h1>
        <p className="text-lg text-surface-dim max-w-md">
          Generador de imágenes con IA · Auto-publicación en Meta
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="bg-secondary hover:bg-secondary-hover text-white font-semibold px-8 py-3.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <BarChart3 size={20} />
          Ir al Dashboard
        </Link>
        <Link
          href="/generate"
          className="border border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-3.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Wand2 size={20} />
          Generar Imagen
        </Link>
      </div>

      <div className="flex gap-8 mt-4">
        <div className="text-center">
          <p className="text-3xl font-bold text-white">Gemini</p>
          <p className="text-sm text-surface-dim mt-1">Google AI</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">DALL·E 3</p>
          <p className="text-sm text-surface-dim mt-1">OpenAI</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-white">Flux + SD</p>
          <p className="text-sm text-surface-dim mt-1">OpenRouter</p>
        </div>
      </div>
    </main>
  );
}
