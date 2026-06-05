"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Download,
  Share2,
  Eye,
  Edit3,
  Sparkles,
  CalendarDays,
  ChevronDown,
  Facebook,
  Instagram,
  Trash2,
  Save,
  ArrowRight,
  Palette,
  ImageIcon,
  Clock,
  CheckCircle2,
} from "lucide-react";

const imageLibrary = [
  { id: "1", name: "Viernes de Promo", color: "bg-secondary-fixed" },
  { id: "2", name: "Sábado Especial", color: "bg-primary-fixed" },
  { id: "3", name: "Domingo Relax", color: "bg-surface-container-high" },
  { id: "4", name: "Oferta Flash", color: "bg-secondary-fixed-dim" },
  { id: "5", name: "Nuevo Plato", color: "bg-primary-fixed-dim" },
  { id: "6", name: "Cóctel del Día", color: "bg-surface-container" },
];

const weeks = [
  "22 de Marzo - 28 de Marzo",
  "29 de Marzo - 04 de Abril",
  "05 de Abril - 11 de Abril",
];

const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const contentSlots = {
  feedPost: ["Foto Promocional", "Oferta del Día"],
  story: ["Historia del Día", "Behind the Scenes"],
  reel: [],
};

const history = [
  {
    id: "1",
    period: "Semana 22 - 28 Mar",
    status: "Publicado",
    style: "Dark Minimalist Luxury",
    highlights: "Promo, Oferta Flash, Cóctel",
    platforms: ["facebook", "instagram"],
  },
  {
    id: "2",
    period: "Semana 15 - 21 Mar",
    status: "Publicado",
    style: "Warm Golden Hour",
    highlights: "Nuevo Plato, Sábado Especial",
    platforms: ["facebook", "instagram"],
  },
  {
    id: "3",
    period: "Semana 08 - 14 Mar",
    status: "Borrador",
    style: "Neon Night",
    highlights: "Domingo Relax",
    platforms: ["facebook"],
  },
];

const historyStatusStyles: Record<string, string> = {
  Publicado: "bg-green-100 text-green-800",
  Borrador: "bg-surface-container text-on-surface-variant",
  Programado: "bg-primary-fixed text-primary-dark",
};

export default function SchedulePage() {
  const [selectedWeek, setSelectedWeek] = useState(weeks[0]);
  const [weekOpen, setWeekOpen] = useState(false);
  const [styleDescription, setStyleDescription] = useState("");
  const [activeSlots, setActiveSlots] = useState({
    feedPost: [...contentSlots.feedPost],
    story: [...contentSlots.story],
    reel: [...contentSlots.reel],
  });
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [statusOpen, setStatusOpen] = useState(false);

  const removeSlot = (category: keyof typeof activeSlots, item: string) => {
    setActiveSlots((prev) => ({
      ...prev,
      [category]: prev[category].filter((s) => s !== item),
    }));
  };

  return (
    <div className="space-y-6">
      {/* ─── Top Row: 3-Column Layout ─── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Column 1 - Biblioteca de Contenido (3/12) */}
        <div className="col-span-3 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-title-md text-on-surface">Biblioteca de Contenido</h3>
            <Link
              href="/media"
              className="text-label-sm text-primary hover:text-primary-hover flex items-center gap-1"
            >
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <p className="text-body-md text-on-surface-variant mb-4">
            Contenido disponible para programar la semana
          </p>

          <div className="grid grid-cols-2 gap-3">
            {imageLibrary.map((img) => (
              <div
                key={img.id}
                className="group cursor-pointer"
              >
                <div
                  className={`${img.color} aspect-square rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-[1.02]`}
                >
                  <ImageIcon size={28} className="text-on-surface-variant opacity-60" />
                </div>
                <p className="text-body-md text-on-surface font-medium truncate">{img.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 - Programación Semanal (5/12) */}
        <div className="col-span-5 card p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-title-md text-on-surface">Programación Automatizada</h3>
            <button className="text-label-sm text-secondary hover:text-secondary-hover flex items-center gap-1.5">
              <Sparkles size={14} /> Autocompletar con IA
            </button>
          </div>
          <p className="text-body-md text-on-surface-variant mb-5">
            Selecciona el contenido para cada día y programa las publicaciones
          </p>

          <div className="flex items-center gap-2 mb-5">
            {days.map((day) => (
              <div
                key={day}
                className="flex-1 text-center py-2 rounded-lg bg-surface-container text-label-sm text-on-surface-variant"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Week selector */}
          <div className="relative mb-5">
            <label className="block text-label-sm text-on-surface mb-2">Elegir Semana</label>
            <button
              onClick={() => setWeekOpen(!weekOpen)}
              className="input-field flex items-center justify-between text-left"
            >
              <span className="flex items-center gap-2">
                <CalendarDays size={16} className="text-on-surface-variant" />
                {selectedWeek}
              </span>
              <ChevronDown size={16} className={`transition-transform ${weekOpen ? "rotate-180" : ""}`} />
            </button>
            {weekOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-20 overflow-hidden">
                {weeks.map((w) => (
                  <button
                    key={w}
                    onClick={() => {
                      setSelectedWeek(w);
                      setWeekOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container transition-colors ${
                      w === selectedWeek
                        ? "bg-primary-fixed text-primary-dark font-medium"
                        : "text-on-surface"
                    }`}
                  >
                    {w}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Slots by Category */}
          <div className="space-y-4">
            {[
              { key: "feedPost" as const, label: "Posts de Feed", icon: Facebook },
              { key: "story" as const, label: "Stories", icon: Instagram },
              { key: "reel" as const, label: "Reels", icon: Share2 },
            ].map(({ key, label, icon: Icon }) => (
              <div key={key}>
                <label className="block text-label-sm text-on-surface mb-2">{label}</label>
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-lg bg-surface-low border border-outline-variant">
                  {activeSlots[key].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant rounded-full text-body-md text-on-surface"
                    >
                      {item}
                      <button onClick={() => removeSlot(key, item)} className="hover:text-error transition-colors">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <button className="inline-flex items-center gap-1 px-3 py-1.5 text-body-md text-primary hover:text-primary-hover">
                    <Plus size={14} />
                    Agregar {label.slice(0, -1)}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-6 pt-5 border-t border-outline-variant">
            <button className="btn-tertiary text-error flex items-center gap-2">
              <Trash2 size={16} />
              Borrar Programación
            </button>
            <button className="btn-primary flex items-center gap-2 ml-auto">
              <Save size={16} />
              Programar Semana
            </button>
          </div>
        </div>

        {/* Column 3 - Vista Previa + Publicar (4/12) */}
        <div className="col-span-4 space-y-5">
          {/* Style config */}
          <div className="card p-5">
            <h3 className="text-title-md text-on-surface flex items-center gap-2 mb-4">
              <Palette size={20} className="text-primary" /> Estilo Visual
            </h3>

            <label className="block text-label-sm text-on-surface mb-2">
              Descripción del Estilo Visual
            </label>
            <textarea
              value={styleDescription}
              onChange={(e) => setStyleDescription(e.target.value)}
              rows={3}
              placeholder="Describe el estilo visual deseado para las imágenes..."
              className="input-field resize-none mb-3"
            />

            <div className="flex items-center justify-between">
              <button className="btn-secondary text-body-md flex items-center gap-2">
                <Plus size={16} />
                Imagen de Referencia
              </button>
              <button className="text-label-sm text-secondary hover:text-secondary-hover flex items-center gap-1.5">
                <Sparkles size={14} /> Generar con IA
              </button>
            </div>
          </div>

          {/* Preview Card */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-title-md text-on-surface">Vista Previa</h3>
              <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary-dark text-label-sm">
                IA DRAFT
              </span>
            </div>

            {/* Preview content */}
            <div className="bg-tertiary rounded-lg p-5 mb-4">
              <p className="text-white text-lg font-bold mb-4">De Vega</p>

              <div className="space-y-3">
                <div>
                  <p className="text-secondary text-label-sm uppercase tracking-wider mb-1">
                    Post Principal
                  </p>
                  <p className="text-white text-body-md">Viernes de Promo · Dark Luxury</p>
                </div>

                <div>
                  <p className="text-secondary text-label-sm uppercase tracking-wider mb-1">
                    Stories
                  </p>
                  <p className="text-white text-body-md">Historia del Día · Behind the Scenes</p>
                </div>
              </div>
            </div>

            {/* Platform buttons */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                <Facebook size={16} className="text-[#1877F2]" />
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#E4405F]/10 flex items-center justify-center">
                <Instagram size={16} className="text-[#E4405F]" />
              </span>
              <span className="w-8 h-8 rounded-lg bg-[#E4405F]/10 flex items-center justify-center">
                <Share2 size={16} className="text-[#E4405F]" />
              </span>
            </div>

            <button className="btn-secondary w-full text-body-md flex items-center justify-center gap-2 mb-2">
              <Download size={16} />
              Descargar Preview
            </button>
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <Share2 size={16} />
              Publicar Programación
            </button>
          </div>
        </div>
      </div>

      {/* ─── Bottom: History Table ─── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-title-md text-on-surface">Historial de Publicaciones</h3>

          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              Filtrar por: <span className="font-medium">{statusFilter}</span>
              <ChevronDown size={16} className={`transition-transform ${statusOpen ? "rotate-180" : ""}`} />
            </button>
            {statusOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-20 overflow-hidden min-w-[160px]">
                {["Todos", "Publicado", "Programado", "Borrador"].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setStatusFilter(s); setStatusOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container transition-colors ${
                      s === statusFilter ? "bg-primary-fixed text-primary-dark font-medium" : "text-on-surface"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-3 px-4 text-label-sm text-on-surface-variant font-medium">Periodo</th>
                <th className="text-left py-3 px-4 text-label-sm text-on-surface-variant font-medium">Estilo Visual</th>
                <th className="text-left py-3 px-4 text-label-sm text-on-surface-variant font-medium">Contenido Destacado</th>
                <th className="text-left py-3 px-4 text-label-sm text-on-surface-variant font-medium">Estado</th>
                <th className="text-right py-3 px-4 text-label-sm text-on-surface-variant font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-outline-variant hover:bg-surface-low transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={16} className="text-on-surface-variant" />
                      <span className="text-body-md text-on-surface font-medium">{row.period}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-body-md text-on-surface">{row.style}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-body-md text-on-surface-variant">{row.highlights}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm ${
                      historyStatusStyles[row.status]
                    }`}>
                      {row.status === "Publicado" && <CheckCircle2 size={12} />}
                      {row.status === "Programado" && <Clock size={12} />}
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface">
                        <Eye size={16} />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant hover:text-primary">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
