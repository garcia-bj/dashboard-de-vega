"use client";

import { useState } from "react";
import {
  Store,
  Sparkles,
  Share2,
  Bell,
  Shield,
  ChevronRight,
  Upload,
  Facebook,
  Instagram,
  Eye,
  EyeOff,
  Key,
  Globe,
  Smartphone,
  Mail,
  Save,
  RotateCcw,
} from "lucide-react";

type SocialAccount = {
  id: string;
  name: string;
  icon: typeof Facebook;
  connected: boolean;
  publications?: number;
};

export default function SettingsPage() {
  const [restaurantName, setRestaurantName] = useState("De Vega");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("admin@devega.com");
  const [phone, setPhone] = useState("");

  // API Keys
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);

  // Toggles
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [generateImages, setGenerateImages] = useState(true);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [dailyReports, setDailyReports] = useState(false);
  const [postConfirmations, setPostConfirmations] = useState(true);

  const [saving, setSaving] = useState(false);

  const socialAccounts: SocialAccount[] = [
    { id: "1", name: "Facebook", icon: Facebook, connected: false },
    { id: "2", name: "Instagram", icon: Instagram, connected: false },
    { id: "3", name: "Instagram Stories", icon: Instagram, connected: false },
  ];

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
  };

  const handleDiscard = () => {
    setRestaurantName("De Vega");
    setLocation("");
    setEmail("admin@devega.com");
    setPhone("");
    setGeminiKey("");
    setOpenaiKey("");
    setOpenrouterKey("");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-headline-lg text-on-surface">Configuración</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Gestiona las preferencias, APIs y conexiones de De Vega
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Guardando...
            </>
          ) : (
            <>
              <Save size={16} />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {/* ─── Section 1: Perfil ─── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded-lg bg-primary-fixed">
            <Store size={20} className="text-primary" />
          </div>
          <h3 className="text-title-md text-on-surface">Perfil del Estudio</h3>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Nombre</label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Ubicación</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Cochabamba, Bolivia"
              className="input-field"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-label-sm text-on-surface mb-2">Logo del Estudio</label>
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/40 hover:bg-surface-low transition-colors">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center">
                <Upload size={24} className="text-primary" />
              </div>
              <div className="text-center">
                <p className="text-body-md text-on-surface font-medium">Subir nuevo logo</p>
                <p className="text-label-sm text-on-surface-variant">PNG, JPG hasta 5MB</p>
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Email de Contacto</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Teléfono</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+591 ..."
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* ─── Section 2: Configuración de IA ─── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded-lg bg-secondary-fixed">
            <Sparkles size={20} className="text-secondary-dark" />
          </div>
          <h3 className="text-title-md text-on-surface">Configuración de IA</h3>
        </div>

        <div className="space-y-5">
          {/* Gemini */}
          <div>
            <label className="block text-label-sm text-on-surface mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Key size={16} className="text-on-surface-variant" />
              </div>
              <input
                type={showGeminiKey ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..."
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* OpenAI */}
          <div>
            <label className="block text-label-sm text-on-surface mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Key size={16} className="text-on-surface-variant" />
              </div>
              <input
                type={showOpenaiKey ? "text" : "password"}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder="sk-..."
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {showOpenaiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* OpenRouter */}
          <div>
            <label className="block text-label-sm text-on-surface mb-2">
              OpenRouter API Key
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Key size={16} className="text-on-surface-variant" />
              </div>
              <input
                type={showOpenrouterKey ? "text" : "password"}
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-..."
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowOpenrouterKey(!showOpenrouterKey)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {showOpenrouterKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant space-y-4">
            {/* Toggle: Auto Generate */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-on-surface font-medium">Autogenerar Publicaciones</p>
                <p className="text-label-sm text-on-surface-variant">
                  Sugerencias inteligentes diarias basadas en tendencias
                </p>
              </div>
              <button
                onClick={() => setAutoGenerate(!autoGenerate)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  autoGenerate ? "bg-primary" : "bg-outline"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    autoGenerate ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Toggle: Generate Images */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-on-surface font-medium">Generar Imágenes</p>
                <p className="text-label-sm text-on-surface-variant">
                  Creación de visuales premium con IA
                </p>
              </div>
              <button
                onClick={() => setGenerateImages(!generateImages)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  generateImages ? "bg-primary" : "bg-outline"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    generateImages ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Section 3: Redes Sociales ─── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded-lg bg-primary-fixed">
            <Share2 size={20} className="text-primary" />
          </div>
          <h3 className="text-title-md text-on-surface">Redes Sociales</h3>
        </div>

        <div className="space-y-4">
          {socialAccounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-4 rounded-xl bg-surface-low"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                  <account.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{account.name}</p>
                  <span className="text-label-sm text-on-surface-variant">
                    {account.connected ? "Conectado" : "No conectado"}
                  </span>
                </div>
                {account.connected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-label-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Conectado
                  </span>
                )}
              </div>
              <button
                className={`btn-secondary text-body-md ${
                  account.connected ? "" : "border-primary bg-primary text-white hover:bg-primary-hover"
                }`}
              >
                {account.connected ? "Gestionar" : "Conectar"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Section 4: Notificaciones ─── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded-lg bg-secondary-fixed">
            <Bell size={20} className="text-secondary-dark" />
          </div>
          <h3 className="text-title-md text-on-surface">Notificaciones</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md text-on-surface font-medium">Alertas del Sistema</p>
              <p className="text-label-sm text-on-surface-variant">
                Notificaciones sobre el estado de generación y publicación
              </p>
            </div>
            <button
              onClick={() => setSystemAlerts(!systemAlerts)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                systemAlerts ? "bg-primary" : "bg-outline"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  systemAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md text-on-surface font-medium">Reportes Diarios (Email)</p>
              <p className="text-label-sm text-on-surface-variant">
                Resumen diario de métricas y publicaciones realizadas
              </p>
            </div>
            <button
              onClick={() => setDailyReports(!dailyReports)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                dailyReports ? "bg-primary" : "bg-outline"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  dailyReports ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md text-on-surface font-medium">Confirmación de Publicaciones</p>
              <p className="text-label-sm text-on-surface-variant">
                Notificar cuando una publicación se complete exitosamente
              </p>
            </div>
            <button
              onClick={() => setPostConfirmations(!postConfirmations)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                postConfirmations ? "bg-primary" : "bg-outline"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  postConfirmations ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Section 5: Seguridad ─── */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded-lg bg-surface-container-high">
            <Shield size={20} className="text-tertiary-dark" />
          </div>
          <h3 className="text-title-md text-on-surface">Seguridad</h3>
        </div>

        <div className="space-y-1">
          <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-low transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                <RotateCcw size={20} className="text-on-surface-variant" />
              </div>
              <div className="text-left">
                <p className="text-body-md text-on-surface font-medium">Cambiar Contraseña</p>
                <p className="text-label-sm text-on-surface-variant">Actualiza tu contraseña de acceso</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>

          <button className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-surface-low transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                <Shield size={20} className="text-on-surface-variant" />
              </div>
              <div className="text-left">
                <p className="text-body-md text-on-surface font-medium">Autenticación de Dos Factores</p>
                <p className="text-label-sm text-on-surface-variant">Desactivado</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={handleDiscard} className="btn-tertiary flex items-center gap-2">
          <RotateCcw size={16} />
          Descartar Cambios
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? "Guardando..." : (
            <>
              <Save size={16} />
              Guardar Configuración
            </>
          )}
        </button>
      </div>
    </div>
  );
}
