"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useSettingsStore } from "@/store/settings";
import {
  Store, Sparkles, Share2, Bell, Shield, ChevronRight, Upload,
  Facebook, Instagram, Eye, EyeOff, Key, Save, RotateCcw, ImagePlus, Trash2,
} from "lucide-react";

export default function SettingsPage() {
  const { logo, referenceImage, setLogo, setReferenceImage } = useSettingsStore();
  const logoRef = useRef<HTMLInputElement>(null);
  const refRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("De Vega");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("admin@devega.com");
  const [phone, setPhone] = useState("");
  const [gemini, setGemini] = useState(""); const [showG, setShowG] = useState(false);
  const [openai, setOpenai] = useState(""); const [showO, setShowO] = useState(false);
  const [openrouter, setOpenrouter] = useState(""); const [showR, setShowR] = useState(false);
  const [autoGen, setAutoGen] = useState(true);
  const [genImg, setGenImg] = useState(true);
  const [sysAlerts, setSysAlerts] = useState(true);
  const [daily, setDaily] = useState(false);
  const [confirm, setConfirm] = useState(true);
  const [saving, setSaving] = useState(false);

  const accounts = [
    { name: "Facebook", icon: Facebook, connected: false },
    { name: "Instagram", icon: Instagram, connected: false },
    { name: "Stories", icon: Instagram, connected: false },
  ];

  const toB64 = (f: File): Promise<string> => new Promise((resolve, reject) => {
    const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(f);
  });

  const section = "rounded-md border bg-card p-4 md:p-6";
  const heading = "flex items-center gap-3 mb-4 pb-4 border-b";
  const labelClass = "text-xs font-semibold mb-1.5 block";

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div><motion.h2 initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-semibold">Configuración</motion.h2><p className="text-sm text-muted-foreground">API keys, logo y conexiones</p></div>
        <Button onClick={async () => { setSaving(true); await new Promise((r) => setTimeout(r, 600)); setSaving(false); toast.success("Guardado"); }} disabled={saving} className="gap-2">
          <Save size={14} />Guardar Cambios
        </Button>
      </div>

      {/* Perfil */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={section}>
        <div className={heading}><Store size={18} className="text-primary" /><h3 className="font-semibold">Perfil & Assets</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label className={labelClass}>Nombre</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label className={labelClass}>Ubicación</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Cochabamba, BO" /></div>
          <div>
            <Label className={labelClass}>Logo <span className="text-secondary">*usado en IA</span></Label>
            <input ref={logoRef} type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5*1024*1024) { toast.error("Máx 5MB"); return; } setLogo(await toB64(f)); toast.success("Logo actualizado"); }} className="hidden" />
            {logo ? (
              <div className="border rounded-md p-3 flex items-center gap-3"><img src={logo} className="w-12 h-12 rounded object-contain bg-muted" alt="logo" /><div className="flex-1 min-w-0"><p className="text-sm font-medium">Logo cargado</p><p className="text-xs text-muted-foreground">Base64 listo</p></div><Button variant="ghost" size="icon" onClick={() => setLogo(null)} className="text-destructive"><Trash2 size={14} /></Button></div>
            ) : (
              <button onClick={() => logoRef.current?.click()} className="w-full border-2 border-dashed rounded-md p-6 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-accent/50 transition-all text-sm text-muted-foreground"><Upload size={22} />Subir logo (PNG/JPG, 5MB)</button>
            )}
          </div>
          <div>
            <Label className={labelClass}>Imagen Ref <span className="text-secondary">*guía visual</span></Label>
            <input ref={refRef} type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 5*1024*1024) { toast.error("Máx 5MB"); return; } setReferenceImage(await toB64(f)); toast.success("Ref actualizada"); }} className="hidden" />
            {referenceImage ? (
              <div className="border rounded-md p-3 flex items-center gap-3"><img src={referenceImage} className="w-12 h-12 rounded object-cover bg-muted" alt="ref" /><div className="flex-1 min-w-0"><p className="text-sm font-medium">Referencia cargada</p><p className="text-xs text-muted-foreground">Se envía como guía</p></div><Button variant="ghost" size="icon" onClick={() => setReferenceImage(null)} className="text-destructive"><Trash2 size={14} /></Button></div>
            ) : (
              <button onClick={() => refRef.current?.click()} className="w-full border-2 border-dashed rounded-md p-6 flex flex-col items-center gap-2 hover:border-primary/30 hover:bg-accent/50 transition-all text-sm text-muted-foreground"><ImagePlus size={22} />Subir referencia (5MB)</button>
            )}
          </div>
          <div><Label className={labelClass}>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><Label className={labelClass}>Teléfono</Label><Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+591" /></div>
        </div>
      </motion.div>

      {/* IA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={section}>
        <div className={heading}><Sparkles size={18} className="text-secondary" /><h3 className="font-semibold">APIs de IA</h3></div>
        {([
          ["Gemini API Key", gemini, setGemini, showG, setShowG, "AIza..."] as const,
          ["OpenAI API Key", openai, setOpenai, showO, setShowO, "sk-..."] as const,
          ["OpenRouter API Key", openrouter, setOpenrouter, showR, setShowR, "sk-or-..."] as const,
        ]).map(([l, v, set, show, setShow, ph]) => (
          <div key={l as string} className="mb-3"><Label className={labelClass}>{l}</Label>
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input type={show ? "text" : "password"} value={v as string} onChange={(e) => (set as any)(e.target.value)} placeholder={ph as string} className="pl-9 pr-9" />
              <button onClick={() => (setShow as any)(!(show as boolean))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{(show as boolean) ? <EyeOff size={14} /> : <Eye size={14} />}</button>
            </div>
          </div>
        ))}
        <div className="pt-3 border-t space-y-3">
          {([
            ["Autogenerar Publicaciones" as const, "Sugerencias diarias" as const, autoGen, setAutoGen as any] as const,
            ["Generar Imágenes" as const, "Visuales premium IA" as const, genImg, setGenImg as any] as const,
          ]).map(([t, d, v, set]) => (
            <div key={t} className="flex items-center justify-between"><div><p className="text-sm font-medium">{t}</p><p className="text-xs text-muted-foreground">{d}</p></div><Switch checked={v as boolean} onCheckedChange={set as any} /></div>
          ))}
        </div>
      </motion.div>

      {/* Redes */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={section}>
        <div className={heading}><Share2 size={18} className="text-primary" /><h3 className="font-semibold">Redes Sociales</h3></div>
        <div className="space-y-3">
          {accounts.map((a) => (
            <div key={a.name} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
              <div className="flex items-center gap-3"><a.icon size={18} className="text-primary" /><div><p className="text-sm font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">No conectado</p></div></div>
              <Button variant={a.connected ? "outline" : "default"} size="sm">{a.connected ? "Gestionar" : "Conectar"}</Button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notificaciones */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={section}>
        <div className={heading}><Bell size={18} className="text-secondary" /><h3 className="font-semibold">Notificaciones</h3></div>
        <div className="space-y-3">
          {([
            ["Alertas del Sistema" as const, sysAlerts, setSysAlerts as any] as const,
            ["Reportes Diarios" as const, daily, setDaily as any] as const,
            ["Confirmación de Posts" as const, confirm, setConfirm as any] as const,
          ]).map(([t, v, set]) => (
            <div key={t} className="flex items-center justify-between"><p className="text-sm">{t}</p><Switch checked={v as boolean} onCheckedChange={set as any} /></div>
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
        <Button variant="ghost" onClick={() => toast("Descartado")} className="gap-2"><RotateCcw size={14} />Descartar</Button>
        <Button onClick={async () => { setSaving(true); await new Promise((r) => setTimeout(r, 600)); setSaving(false); toast.success("Guardado"); }} disabled={saving} className="gap-2"><Save size={14} />Guardar Configuración</Button>
      </div>
    </div>
  );
}
