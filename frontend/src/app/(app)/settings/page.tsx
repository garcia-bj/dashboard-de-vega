"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/store/settings";
import { useAuthStore } from "@/store/auth";
import { api, type SettingsOut } from "@/lib/api";
import {
  Store, Sparkles, Share2, Bell, Shield, ChevronRight, Upload,
  Facebook, Instagram, Eye, EyeOff, Key, Save, RotateCcw, ImagePlus, Trash2, Loader2,
} from "lucide-react";

const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } } };

export default function SettingsPage() {
  const { logo, referenceImage, setLogo, setReferenceImage } = useSettingsStore();
  const token = useAuthStore((s) => s.token) || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const logoRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gemini, setGemini] = useState(""); const [showG, setShowG] = useState(false);
  const [openai, setOpenai] = useState(""); const [showO, setShowO] = useState(false);
  const [openrouter, setOpenrouter] = useState(""); const [showR, setShowR] = useState(false);
  const [geminiOk, setGeminiOk] = useState(false);
  const [openaiOk, setOpenaiOk] = useState(false);
  const [openrouterOk, setOpenrouterOk] = useState(false);
  const [autoGen, setAutoGen] = useState(true);
  const [genImg, setGenImg] = useState(true);
  const [sysAlerts, setSysAlerts] = useState(true);
  const [daily, setDaily] = useState(false);
  const [confirm, setConfirm] = useState(true);

  useEffect(() => {
    if (!token) return;
    api.settings.get(token).then((s: SettingsOut) => {
      setName(s.full_name || "");
      setEmail(s.email);
      setGeminiOk(s.gemini_configured);
      setOpenaiOk(s.openai_configured);
      setOpenrouterOk(s.openrouter_configured);
      if (s.logo && !logo) setLogo(s.logo);
      if (s.reference_image && !referenceImage) setReferenceImage(s.reference_image);
    }).catch(() => toast.error("No se pudo cargar la configuración")).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogoUpload = async (file: File) => {
    if (!token) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    try {
      const res = await api.settings.uploadLogo(file, token);
      setLogo(res.logo);
      toast.success("Logo actualizado");
    } catch { toast.error("Error al subir logo"); }
  };

  const handleRefUpload = async (file: File) => {
    if (!token) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Máx 5MB"); return; }
    try {
      const res = await api.settings.uploadReference(file, token);
      setReferenceImage(res.reference_image);
      toast.success("Referencia actualizada");
    } catch { toast.error("Error al subir referencia"); }
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload: Record<string, string | null> = { full_name: name || null };
      if (gemini) payload.gemini_api_key = gemini;
      if (openai) payload.openai_api_key = openai;
      if (openrouter) payload.openrouter_api_key = openrouter;
      const updated = await api.settings.update(payload, token);
      setGeminiOk(updated.gemini_configured);
      setOpenaiOk(updated.openai_configured);
      setOpenrouterOk(updated.openrouter_configured);
      setGemini(""); setOpenai(""); setOpenrouter("");
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  };

  const card = "rounded-2xl border border-border bg-card p-5 md:p-6";
  const sectionHeader = "flex items-center gap-3 mb-5 pb-4 border-b border-border";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }} className="space-y-5 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Configuración</h2>
          <p className="text-xs text-muted-foreground">API keys, logo y conexiones</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar Cambios
        </button>
      </div>

      {/* Perfil */}
      <motion.div variants={item} className={card}>
        <div className={sectionHeader}>
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Perfil & Assets</h3>
            <p className="text-xs text-muted-foreground">Logo y datos del negocio</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Nombre</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-muted border-border rounded-xl h-10" />
          </div>
          <div>
            <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">Email</Label>
            <Input type="email" value={email} disabled className="bg-muted border-border rounded-xl h-10 opacity-50" />
          </div>

          {/* Logo */}
          <div>
            <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
              Logo <span className="text-secondary">*IA lo usa</span>
            </Label>
            <input ref={logoRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} className="hidden" />
            {logo ? (
              <div className="border border-border rounded-xl p-3 flex items-center gap-3 bg-muted/40">
                <img src={logo} className="w-11 h-11 rounded-lg object-contain bg-muted" alt="logo" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Logo cargado</p>
                  <p className="text-xs text-muted-foreground">Listo para IA</p>
                </div>
                <button onClick={() => setLogo(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => logoRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground">
                <Upload size={20} />
                <span className="text-xs">Subir logo (PNG/JPG, 5MB)</span>
              </button>
            )}
          </div>

          {/* Referencia */}
          <div>
            <Label className="text-xs font-semibold text-foreground/70 mb-1.5 block">
              Imagen Ref <span className="text-secondary">*guía visual</span>
            </Label>
            <input ref={refRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRefUpload(f); }} className="hidden" />
            {referenceImage ? (
              <div className="border border-border rounded-xl p-3 flex items-center gap-3 bg-muted/40">
                <img src={referenceImage} className="w-11 h-11 rounded-lg object-cover bg-muted" alt="ref" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Referencia cargada</p>
                  <p className="text-xs text-muted-foreground">Se envía como guía</p>
                </div>
                <button onClick={() => setReferenceImage(null)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button onClick={() => refRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all text-muted-foreground">
                <ImagePlus size={20} />
                <span className="text-xs">Subir referencia (5MB)</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* APIs de IA */}
      <motion.div variants={item} className={card}>
        <div className={sectionHeader}>
          <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">APIs de IA</h3>
            <p className="text-xs text-muted-foreground">Claves para generación de imágenes</p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          {([
            ["Gemini API Key",      gemini,      setGemini,      showG, setShowG, "AIza...",     geminiOk]     as const,
            ["OpenAI API Key",      openai,      setOpenai,      showO, setShowO, "sk-...",       openaiOk]     as const,
            ["OpenRouter API Key",  openrouter,  setOpenrouter,  showR, setShowR, "sk-or-...",   openrouterOk] as const,
          ]).map(([l, v, set, show, setShow, ph, configured]) => (
            <div key={l as string}>
              <div className="flex items-center gap-2 mb-1.5">
                <Label className="text-xs font-semibold text-foreground/70">{l as string}</Label>
                {(configured as boolean) && !(v as string) && (
                  <Badge variant="success" className="text-xs">Configurada</Badge>
                )}
              </div>
              <div className="relative">
                <Key size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={(show as boolean) ? "text" : "password"}
                  value={v as string}
                  onChange={(e) => (set as (v: string) => void)(e.target.value)}
                  placeholder={(configured as boolean) ? "•••••••• (dejar vacío para mantener)" : ph as string}
                  className="pl-9 pr-9 bg-muted border-border rounded-xl h-10"
                />
                <button onClick={() => (setShow as (v: boolean) => void)(!(show as boolean))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {(show as boolean) ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          {([
            ["Autogenerar Publicaciones" as const, "Sugerencias diarias de IA" as const, autoGen, setAutoGen as (v: boolean) => void] as const,
            ["Generar Imágenes" as const,          "Imágenes premium con IA" as const,   genImg,  setGenImg  as (v: boolean) => void] as const,
          ]).map(([t, d, v, set]) => (
            <div key={t} className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-foreground">{t}</p>
                <p className="text-xs text-muted-foreground">{d}</p>
              </div>
              <Switch checked={v as boolean} onCheckedChange={set} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Redes Sociales */}
      <motion.div variants={item} className={card}>
        <div className={sectionHeader}>
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Share2 size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Redes Sociales</h3>
            <p className="text-xs text-muted-foreground">Conecta tus cuentas de Meta</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { name: "Facebook", icon: Facebook, color: "text-blue-400", bg: "bg-blue-500/10" },
            { name: "Instagram", icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/10" },
            { name: "Stories", icon: Instagram, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map((a) => (
            <div key={a.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center`}>
                  <a.icon size={17} className={a.color} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{a.name}</p>
                  <p className="text-xs text-muted-foreground">No conectado</p>
                </div>
              </div>
              <button className="h-8 px-3 rounded-xl text-xs font-semibold text-white"
                style={{ background: "hsl(var(--primary))" }}>
                Conectar
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notificaciones */}
      <motion.div variants={item} className={card}>
        <div className={sectionHeader}>
          <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center">
            <Bell size={16} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
            <p className="text-xs text-muted-foreground">Preferencias de alertas</p>
          </div>
        </div>
        <div className="space-y-3">
          {([
            ["Alertas del Sistema"   as const, sysAlerts, setSysAlerts as (v: boolean) => void] as const,
            ["Reportes Diarios"      as const, daily,     setDaily     as (v: boolean) => void] as const,
            ["Confirmación de Posts" as const, confirm,   setConfirm   as (v: boolean) => void] as const,
          ]).map(([t, v, set]) => (
            <div key={t} className="flex items-center justify-between py-1">
              <p className="text-sm text-foreground">{t}</p>
              <Switch checked={v as boolean} onCheckedChange={set} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Seguridad */}
      <motion.div variants={item} className={card}>
        <div className={sectionHeader}>
          <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
            <Shield size={16} className="text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Seguridad</h3>
            <p className="text-xs text-muted-foreground">Contraseña y autenticación</p>
          </div>
        </div>
        <div className="space-y-1">
          {[
            { label: "Cambiar Contraseña", icon: RotateCcw, badge: null },
            { label: "Autenticación 2FA",  icon: Shield,    badge: "Desactivado" },
          ].map((r) => (
            <button key={r.label}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors text-foreground">
              <div className="flex items-center gap-3">
                <r.icon size={16} className="text-muted-foreground" />
                <span className="text-sm">{r.label}</span>
                {r.badge && <Badge variant="ghost" className="text-xs">{r.badge}</Badge>}
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex justify-end gap-3 pb-4">
        <button onClick={() => { setGemini(""); setOpenai(""); setOpenrouter(""); toast("Descartado"); }}
          className="h-9 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2">
          <RotateCcw size={14} /> Descartar
        </button>
        <button onClick={handleSave} disabled={saving}
          className="h-9 px-4 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(342 62% 36%))" }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar
        </button>
      </div>
    </motion.div>
  );
}
