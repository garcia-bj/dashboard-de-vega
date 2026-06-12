"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

export default function SettingsPage() {
  const { logo, referenceImage, setLogo, setReferenceImage } = useSettingsStore();
  const token = useAuthStore((s) => s.token) || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const logoRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // API Keys (write-only — never show existing value)
  const [gemini, setGemini] = useState(""); const [showG, setShowG] = useState(false);
  const [openai, setOpenai] = useState(""); const [showO, setShowO] = useState(false);
  const [openrouter, setOpenrouter] = useState(""); const [showR, setShowR] = useState(false);

  // API key configured flags from server
  const [geminiOk, setGeminiOk] = useState(false);
  const [openaiOk, setOpenaiOk] = useState(false);
  const [openrouterOk, setOpenrouterOk] = useState(false);

  // Notifications (local UI state only)
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
      // Sync logo/ref to Zustand store if not already in localStorage
      if (s.logo && !logo) setLogo(s.logo);
      if (s.reference_image && !referenceImage) setReferenceImage(s.reference_image);
    }).catch(() => toast.error("No se pudo cargar la configuración")).finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const toB64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(f);
  });

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
      // Clear key inputs after save
      setGemini(""); setOpenai(""); setOpenrouter("");
      toast.success("Configuración guardada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally { setSaving(false); }
  };

  const section = "rounded-md border bg-card p-4 md:p-6";
  const heading = "flex items-center gap-3 mb-4 pb-4 border-b";
  const labelClass = "text-xs font-semibold mb-1.5 block";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <motion.h2 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-semibold">Configuración</motion.h2>
          <p className="text-sm text-muted-foreground">API keys, logo y conexiones</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar Cambios
        </Button>
      </div>

      {/* Perfil */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={section}>
        <div className={heading}><Store size={18} className="text-primary" /><h3 className="font-semibold">Perfil & Assets</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className={labelClass}>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label className={labelClass}>Email</Label><Input type="email" value={email} disabled className="opacity-60" /></div>
          <div>
            <Label className={labelClass}>Logo <span className="text-secondary">*usado en IA</span></Label>
            <input ref={logoRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} className="hidden" />
            {logo ? (
              <div className="border rounded-md p-3 flex items-center gap-3">
                <img src={logo} className="w-12 h-12 rounded object-contain bg-muted" alt="logo" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium">Logo cargado</p><p className="text-xs text-muted-foreground">Base64 listo</p></div>
                <Button variant="ghost" size="icon" onClick={() => { setLogo(null); }} className="text-destructive"><Trash2 size={14} /></Button>
              </div>
            ) : (
              <button onClick={() => logoRef.current?.click()} className="w-full border-2 border-dashed rounded-md p-6 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-accent/50 transition-all text-sm text-muted-foreground"><Upload size={22} />Subir logo (PNG/JPG, 5MB)</button>
            )}
          </div>
          <div>
            <Label className={labelClass}>Imagen Ref <span className="text-secondary">*guía visual</span></Label>
            <input ref={refRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleRefUpload(f); }} className="hidden" />
            {referenceImage ? (
              <div className="border rounded-md p-3 flex items-center gap-3">
                <img src={referenceImage} className="w-12 h-12 rounded object-cover bg-muted" alt="ref" />
                <div className="flex-1 min-w-0"><p className="text-sm font-medium">Referencia cargada</p><p className="text-xs text-muted-foreground">Se envía como guía</p></div>
                <Button variant="ghost" size="icon" onClick={() => setReferenceImage(null)} className="text-destructive"><Trash2 size={14} /></Button>
              </div>
            ) : (
              <button onClick={() => refRef.current?.click()} className="w-full border-2 border-dashed rounded-md p-6 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-accent/50 transition-all text-sm text-muted-foreground"><ImagePlus size={22} />Subir referencia (5MB)</button>
            )}
          </div>
        </div>
      </motion.div>

      {/* IA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={section}>
        <div className={heading}><Sparkles size={18} className="text-secondary" /><h3 className="font-semibold">APIs de IA</h3></div>
        {([
          ["Gemini API Key", gemini, setGemini, showG, setShowG, "AIza...", geminiOk] as const,
          ["OpenAI API Key", openai, setOpenai, showO, setShowO, "sk-...", openaiOk] as const,
          ["OpenRouter API Key", openrouter, setOpenrouter, showR, setShowR, "sk-or-...", openrouterOk] as const,
        ]).map(([l, v, set, show, setShow, ph, configured]) => (
          <div key={l as string} className="mb-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Label className="text-xs font-semibold">{l}</Label>
              {(configured as boolean) && !v && <Badge variant="success" className="text-xs">Configurada</Badge>}
            </div>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={(show as boolean) ? "text" : "password"}
                value={v as string}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                placeholder={(configured as boolean) ? "••••••••• (dejar vacío para no cambiar)" : ph as string}
                className="pl-9 pr-9"
              />
              <button onClick={() => (setShow as (v: boolean) => void)(!(show as boolean))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {(show as boolean) ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
        ))}
        <div className="pt-3 border-t space-y-3">
          {([
            ["Autogenerar Publicaciones" as const, "Sugerencias diarias" as const, autoGen, setAutoGen as (v: boolean) => void] as const,
            ["Generar Imágenes" as const, "Visuales premium IA" as const, genImg, setGenImg as (v: boolean) => void] as const,
          ]).map(([t, d, v, set]) => (
            <div key={t} className="flex items-center justify-between"><div><p className="text-sm font-medium">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={v as boolean} onCheckedChange={set} /></div>
          ))}
        </div>
      </motion.div>

      {/* Redes */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={section}>
        <div className={heading}><Share2 size={18} className="text-primary" /><h3 className="font-semibold">Redes Sociales</h3></div>
        <div className="space-y-3">
          {[
            { name: "Facebook", icon: Facebook },
            { name: "Instagram", icon: Instagram },
            { name: "Stories", icon: Instagram },
          ].map((a) => (
            <div key={a.name} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-3"><a.icon size={18} className="text-primary" /><div><p className="text-sm font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">No conectado</p></div></div>
              <Button variant="default" size="sm">Conectar</Button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notificaciones */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={section}>
        <div className={heading}><Bell size={18} className="text-secondary" /><h3 className="font-semibold">Notificaciones</h3></div>
        <div className="space-y-3">
          {([
            ["Alertas del Sistema" as const, sysAlerts, setSysAlerts as (v: boolean) => void] as const,
            ["Reportes Diarios" as const, daily, setDaily as (v: boolean) => void] as const,
            ["Confirmación de Posts" as const, confirm, setConfirm as (v: boolean) => void] as const,
          ]).map(([t, v, set]) => (
            <div key={t} className="flex items-center justify-between"><p className="text-sm">{t}</p><Switch checked={v as boolean} onCheckedChange={set} /></div>
          ))}
        </div>
      </motion.div>

      {/* Seguridad */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={section}>
        <div className={heading}><Shield size={18} /><h3 className="font-semibold">Seguridad</h3></div>
        <button className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"><div className="flex items-center gap-3"><RotateCcw size={18} /><span className="text-sm">Cambiar Contraseña</span></div><ChevronRight size={18} /></button>
        <button className="w-full flex items-center justify-between p-3 rounded-md hover:bg-muted/50 transition-colors"><div className="flex items-center gap-3"><Shield size={18} /><span className="text-sm">Autenticación 2FA</span><Badge variant="ghost">Desactivado</Badge></div><ChevronRight size={18} /></button>
      </motion.div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={() => { setGemini(""); setOpenai(""); setOpenrouter(""); toast("Descartado"); }} className="gap-2"><RotateCcw size={14} />Descartar</Button>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
