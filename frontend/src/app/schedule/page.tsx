"use client";

export default function SchedulePage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Programar Publicación</h1>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-5">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Título</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
              placeholder="Mi publicación..."
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Prompt para IA</label>
            <textarea
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 resize-none"
              placeholder="Describe la imagen..."
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Caption / Texto</label>
            <textarea
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100 resize-none"
              placeholder="Texto que acompaña la imagen..."
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Fecha y hora</label>
            <input
              type="datetime-local"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-2">Publicar en</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-brand-500" />
                <span>Facebook</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-brand-500" />
                <span>Instagram Feed</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-brand-500" />
                <span>Instagram Story</span>
              </label>
            </div>
          </div>

          <button className="w-full bg-brand-600 hover:bg-brand-700 rounded-lg py-3 font-semibold transition-colors">
            Programar Publicación
          </button>
        </div>

        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <h2 className="text-lg font-semibold mb-4">Calendario</h2>
          <p className="text-zinc-500">Vista de calendario aquí</p>
        </div>
      </div>
    </div>
  );
}
