"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
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
  Mail,
  Save,
  RotateCcw,
  ImagePlus,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { useSettingsStore } from "@/store/settings";

type SocialAccount = {
  id: string;
  name: string;
  icon: typeof Facebook;
  connected: boolean;
};

export default function SettingsPage() {
  const { logo, referenceImage, setLogo, setReferenceImage } = useSettingsStore();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const refInputRef = useRef<HTMLInputElement>(null);

  const [restaurantName, setRestaurantName] = useState("De Vega");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("admin@devega.com");
  const [phone, setPhone] = useState("");

  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);

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

  const handleFileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Logo máximo 5MB"); return; }
    const b64 = await handleFileToBase64(file);
    setLogo(b64);
    toast.success("Logo actualizado");
  };

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Imagen máximo 5MB"); return; }
    const b64 = await handleFileToBase64(file);
    setReferenceImage(b64);
    toast.success("Imagen de referencia actualizada");
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success("Configuración guardada");
  };

  const handleDiscard = () => {
    setRestaurantName("De Vega");
    setLocation("");
    setEmail("admin@devega.com");
    setPhone("");
    setGeminiKey("");
    setOpenaiKey("");
    setOpenrouterKey("");
    toast("Cambios descartados");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-headline-lg text-on-surface"
          >
            Configuración
          </motion.h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Logos, APIs, redes sociales y preferencias
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? "Guardando..." : <><Save size={16} /> Guardar Cambios</>}
        </button>
      </div>

      {/* ─── Section 1: Perfil + Assets ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded bg-primary-fixed">
            <Store size={20} className="text-primary" />
          </div>
          <h3 className="text-title-md text-on-surface">Perfil & Assets</h3>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Nombre</label>
            <input type="text" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Ubicación</label>
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Cochabamba, Bolivia" className="input-field" />
          </div>

          {/* Logo Upload */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">
              Logo del Estudio <span className="text-secondary">*usado en generación IA</span>
            </label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            {logo ? (
              <div className="relative border border-outline-variant rounded p-3 flex items-center gap-3">
                <img src={logo} alt="Logo" className="w-14 h-14 rounded object-contain bg-surface-container" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-surface font-medium">Logo cargado</p>
                  <p className="text-label-sm text-on-surface-variant">Base64, listo para enviar al webhook</p>
                </div>
                <button
                  onClick={() => setLogo(null)}
                  className="p-2 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => logoInputRef.current?.click()}
                className="w-full border-2 border-dashed border-outline-variant rounded p-6 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-surface-low transition-all"
              >
                <Upload size={24} className="text-on-surface-variant" />
                <span className="text-body-md text-on-surface-variant">Subir logo (PNG, JPG hasta 5MB)</span>
              </button>
            )}
          </div>

          {/* Reference Image Upload */}
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">
              Imagen de Referencia <span className="text-secondary">*usado como guía visual</span>
            </label>
            <input
              ref={refInputRef}
              type="file"
              accept="image/*"
              onChange={handleRefUpload}
              className="hidden"
            />
            {referenceImage ? (
              <div className="relative border border-outline-variant rounded p-3 flex items-center gap-3">
                <img src={referenceImage} alt="Ref" className="w-14 h-14 rounded object-cover bg-surface-container" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md text-on-surface font-medium">Referencia cargada</p>
                  <p className="text-label-sm text-on-surface-variant">Se envía como guía al modelo IA</p>
                </div>
                <button
                  onClick={() => setReferenceImage(null)}
                  className="p-2 rounded hover:bg-error-container text-on-surface-variant hover:text-error transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => refInputRef.current?.click()}
                className="w-full border-2 border-dashed border-outline-variant rounded p-6 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-surface-low transition-all"
              >
                <ImagePlus size={24} className="text-on-surface-variant" />
                <span className="text-body-md text-on-surface-variant">Subir referencia (PNG, JPG hasta 5MB)</span>
              </button>
            )}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Email de Contacto</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-label-sm text-on-surface mb-2">Teléfono</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+591 ..." className="input-field" />
          </div>
        </div>
      </motion.div>

      {/* ─── Section 2: IA ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded bg-secondary-fixed">
            <Sparkles size={20} className="text-secondary-dark" />
          </div>
          <h3 className="text-title-md text-on-surface">APIs de IA</h3>
        </div>

        {([ 
          ["Gemini API Key", geminiKey, setGeminiKey, showGeminiKey, setShowGeminiKey, "AIza..."],
          ["OpenAI API Key", openaiKey, setOpenaiKey, showOpenaiKey, setShowOpenaiKey, "sk-..."],
          ["OpenRouter API Key", openrouterKey, setOpenrouterKey, showOpenrouterKey, setShowOpenrouterKey, "sk-or-..."],
        ] as const).map(([label, value, setter, show, setShow, placeholder]) => (
          <div key={label} className="mb-4">
            <label className="block text-label-sm text-on-surface mb-2">{label}</label>
            <div className="relative">
              <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="input-field pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t border-outline-variant space-y-4">
          {([ 
            ["Autogenerar Publicaciones", "Sugerencias inteligentes diarias", autoGenerate, setAutoGenerate],
            ["Generar Imágenes", "Creación de visuales premium con IA", generateImages, setGenerateImages],
          ] as const).map(([title, desc, value, setter]) => (
            <div key={title} className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-on-surface font-medium">{title}</p>
                <p className="text-label-sm text-on-surface-variant">{desc}</p>
              </div>
              <button
                onClick={() => setter(!value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-outline"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Section 3: Redes Sociales ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded bg-primary-fixed"><Share2 size={20} className="text-primary" /></div>
          <h3 className="text-title-md text-on-surface">Redes Sociales</h3>
        </div>
        <div className="space-y-4">
          {socialAccounts.map((account) => (
            <div key={account.id} className="flex items-center justify-between p-4 rounded bg-surface-low">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center">
                  <account.icon size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-body-md font-semibold text-on-surface">{account.name}</p>
                  <span className="text-label-sm text-on-surface-variant">
                    {account.connected ? "Conectado" : "No conectado"}
                  </span>
                </div>
              </div>
              <button className={`btn-secondary text-body-md ${account.connected ? "" : "border-primary bg-primary text-white hover:bg-primary-hover"}`}>
                {account.connected ? "Gestionar" : "Conectar"}
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Section 4: Notificaciones ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded bg-secondary-fixed"><Bell size={20} className="text-secondary-dark" /></div>
          <h3 className="text-title-md text-on-surface">Notificaciones</h3>
        </div>
        <div className="space-y-4">
          {([ 
            ["Alertas del Sistema", "Estado de generación y publicación", systemAlerts, setSystemAlerts],
            ["Reportes Diarios (Email)", "Resumen diario de métricas", dailyReports, setDailyReports],
            ["Confirmación de Publicaciones", "Notificar al completar", postConfirmations, setPostConfirmations],
          ] as const).map(([title, desc, value, setter]) => (
            <div key={title} className="flex items-center justify-between">
              <div>
                <p className="text-body-md text-on-surface font-medium">{title}</p>
                <p className="text-label-sm text-on-surface-variant">{desc}</p>
              </div>
              <button
                onClick={() => setter(!value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${value ? "bg-primary" : "bg-outline"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-5" : ""}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── Section 5: Seguridad ─── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant">
          <div className="p-2 rounded bg-surface-container-high"><Shield size={20} className="text-tertiary-dark" /></div>
          <h3 className="text-title-md text-on-surface">Seguridad</h3>
        </div>
        <div className="space-y-1">
          <button className="w-full flex items-center justify-between p-4 rounded hover:bg-surface-low transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center"><RotateCcw size={20} className="text-on-surface-variant" /></div>
              <div className="text-left"><p className="text-body-md text-on-surface font-medium">Cambiar Contraseña</p><p className="text-label-sm text-on-surface-variant">Actualiza tu contraseña</p></div>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>
          <button className="w-full flex items-center justify-between p-4 rounded hover:bg-surface-low transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-surface-container flex items-center justify-center"><Shield size={20} className="text-on-surface-variant" /></div>
              <div className="text-left"><p className="text-body-md text-on-surface font-medium">Autenticación de Dos Factores</p><p className="text-label-sm text-on-surface-variant">Desactivado</p></div>
            </div>
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>
        </div>
      </motion.div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button onClick={handleDiscard} className="btn-tertiary flex items-center gap-2">
          <RotateCcw size={16} /> Descartar Cambios
        </button>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save size={16} /> Guardar Configuración
        </button>
      </div>
    </div>
  );
}
