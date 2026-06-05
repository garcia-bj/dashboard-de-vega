"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data: any = await api.auth.login(email, password);

      setAuth(data.access_token, data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-tertiary relative overflow-hidden flex-col justify-center px-16">
        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-tertiary to-secondary/10" />
        <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">De Vega</h1>
          </div>

          <p className="text-5xl font-bold text-white leading-tight mb-6">
            Crea. Programa. <br />
            <span className="text-secondary">Publica.</span>
          </p>

          <p className="text-lg text-surface-dim leading-relaxed">
            Genera imágenes con inteligencia artificial usando Gemini, DALL·E 3 y Stable Diffusion.
            Programa y publica automáticamente en Facebook, Instagram y Stories.
          </p>

          <div className="flex gap-6 mt-12">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-sm text-surface-dim">Gemini</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-sm text-surface-dim">DALL·E 3</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-surface-dim" />
              <span className="text-sm text-surface-dim">Flux + SD</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-auto pt-16">
          <p className="text-sm text-surface-dim">
            &copy; {new Date().getFullYear()} De Vega. AI-Powered Media Studio.
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 bg-surface">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-on-surface">De Vega</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-headline-lg text-on-surface mb-2">Iniciar sesión</h2>
            <p className="text-body-md text-on-surface-variant">
              Accede al centro de gestión de contenido IA
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-error-container text-error text-body-md px-4 py-3 rounded-lg border border-error/20">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-label-sm text-on-surface mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@devega.com"
                  required
                  className="input-field pl-11"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-label-sm text-on-surface mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-outline-variant accent-primary"
                />
                <span className="text-body-md text-on-surface-variant">Recordarme</span>
              </label>
              <button
                type="button"
                className="text-body-md text-primary hover:text-primary-hover font-medium"
              >
                ¿Olvidó su contraseña?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-body-lg"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Ingresando...
                </span>
              ) : (
                <>
                  Entrar
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-outline-variant">
            <p className="text-body-md text-on-surface-variant text-center">
              <span className="text-sm text-surface-dim">Soporte</span>
              <span className="mx-2 text-outline-variant">•</span>
              <span className="text-sm text-surface-dim">Privacidad</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
