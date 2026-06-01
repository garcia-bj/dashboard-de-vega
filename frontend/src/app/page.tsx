import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-5xl font-bold tracking-tight text-brand-500">De Vega</h1>
      <p className="text-zinc-400 text-lg max-w-md text-center">
        Generador de imágenes con IA y auto-publicación en Facebook e Instagram
      </p>

      <div className="flex gap-4">
        <Link
          href="/dashboard"
          className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          Dashboard
        </Link>
        <Link
          href="/generate"
          className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Generar Imagen
        </Link>
      </div>
    </main>
  );
}
