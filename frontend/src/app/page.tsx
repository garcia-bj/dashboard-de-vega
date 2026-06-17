"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useAuthStore } from "../store/auth";

export default function AuthPage() {
  const router = useRouter();
  const { token, setAuth } = useAuthStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    }
  }, [token, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const response = await api.auth.login(email, password) as {
          access_token: string;
          user: { id: string; email: string; full_name?: string };
        };
        setAuth(response.access_token, response.user);
        router.push("/dashboard");
      } else {
        // Register flow
        await api.auth.register(email, password, fullName || undefined);
        setSuccessMsg("Registro completado con éxito. Ahora puedes iniciar sesión.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  };

  if (token) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <p className="text-sm font-medium">Redirigiendo al Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen bg-zinc-950 items-center justify-center p-4 relative overflow-hidden text-zinc-100">
      {/* Decorative gradient backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] bg-brand-600/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-brand-500 tracking-tight mb-2">De Vega</h1>
          <p className="text-zinc-400 text-sm">
            {isLogin
              ? "Generación de Imágenes con IA y Publicación en Meta"
              : "Crea tu cuenta para empezar a publicar"}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/30 border border-red-800 text-red-300 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-green-900/30 border border-green-800 text-green-300 rounded-lg p-4 text-sm">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Nombre Completo</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-brand-500 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-brand-500 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-800/80 border border-zinc-700/80 focus:border-brand-500 rounded-lg px-4 py-2.5 text-zinc-100 placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-3 font-semibold transition-colors shadow-lg shadow-brand-600/20 active:translate-y-[1px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? (isLogin ? "Iniciando sesión..." : "Registrando...")
              : (isLogin ? "Iniciar Sesión" : "Crear Cuenta")}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-zinc-800/80 pt-6">
          <p className="text-sm text-zinc-500">
            {isLogin ? "¿No tienes una cuenta?" : "¿Ya tienes una cuenta?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setSuccessMsg(null);
              }}
              className="text-brand-500 hover:text-brand-400 font-medium transition-colors focus:outline-none font-semibold"
            >
              {isLogin ? "Regístrate gratis" : "Inicia sesión aquí"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
