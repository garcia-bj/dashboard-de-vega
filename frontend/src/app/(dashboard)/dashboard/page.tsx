export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Publicaciones Hoy</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Programadas</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <p className="text-zinc-400 text-sm">Imágenes Generadas</p>
          <p className="text-3xl font-bold mt-1">0</p>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4">Próximas Publicaciones</h2>
        <p className="text-zinc-500">No hay publicaciones programadas.</p>
      </div>
    </div>
  );
}
