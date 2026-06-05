"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  MoreVertical,
  Clock,
  CheckCircle2,
  Edit3,
  AlertCircle,
  Sparkles,
  Trash2,
  Share2,
  Eye,
} from "lucide-react";

const models = ["Gemini", "DALL·E 3", "Flux", "Stable Diffusion", "OpenRouter"];

const galleryItems = [
  {
    id: "1",
    title: "Viernes de Promo",
    description: "Imagen vibrante de un plato gourmet con luces de neón y ambiente festivo, estilo cinematográfico nocturno",
    model: "Gemini",
    status: "published" as const,
    date: "Hoy, 18:00",
    platforms: ["facebook", "instagram"],
  },
  {
    id: "2",
    title: "Sábado Especial",
    description: "Foto minimalista de un cóctel artesanal con frutas tropicales sobre fondo oscuro, gotas de condensación",
    model: "DALL·E 3",
    status: "scheduled" as const,
    date: "Mañana, 08:00",
    platforms: ["instagram"],
  },
  {
    id: "3",
    title: "Sin categoría",
    description: "Pasta artesanal con mix de hongos silvestres y aceite de trufa blanca, presentación rústica elegante",
    model: "Flux",
    status: "draft" as const,
    date: "Editado hace 2h",
    platforms: [],
  },
  {
    id: "4",
    title: "Especial del Día",
    description: "Taco de ribeye con salsa de aguacate y microgreens, iluminación natural lateral, fondo de cocina",
    model: "Stable Diffusion",
    status: "published" as const,
    date: "22 May, 2024",
    platforms: ["facebook", "instagram"],
  },
  {
    id: "5",
    title: "Menú Saludable",
    description: "Bowl de quinua orgánica, vegetales asados, palta fresca y aderezo de tahini, luz cenital suave",
    model: "Gemini",
    status: "published" as const,
    date: "21 May, 2024",
    platforms: ["facebook"],
  },
];

const statusConfig = {
  published: {
    label: "Publicado",
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle2,
  },
  scheduled: {
    label: "Programado",
    bg: "bg-primary-fixed",
    text: "text-primary-dark",
    icon: Clock,
  },
  draft: {
    label: "Borrador",
    bg: "bg-surface-container",
    text: "text-on-surface-variant",
    icon: Edit3,
  },
  failed: {
    label: "Falló",
    bg: "bg-error-container",
    text: "text-error",
    icon: AlertCircle,
  },
};

const dateRanges = ["Últimos 7 días", "Últimos 30 días", "Últimos 90 días", "Este año", "Todo"];
const statusFilters = ["Todos", "Publicado", "Programado", "Borrador"];

export default function MediaPage() {
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState(dateRanges[1]);
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);

  const totalPages = 5;
  const totalItems = 24;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-headline-lg text-on-surface">Galería de Medios</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Gestiona y revisa las imágenes generadas por IA y publicaciones
          </p>
        </div>
        <Link href="/generate" className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Nueva Publicación
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Date range */}
          <div className="relative">
            <button
              onClick={() => setDateRangeOpen(!dateRangeOpen)}
              className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg text-body-md text-on-surface hover:bg-surface-container transition-colors"
            >
              <CalendarDays size={16} className="text-on-surface-variant" />
              {dateRange}
              <ChevronDown size={16} className={`transition-transform ${dateRangeOpen ? "rotate-180" : ""}`} />
            </button>
            {dateRangeOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-outline-variant rounded-lg shadow-lg z-20 overflow-hidden min-w-[200px]">
                {dateRanges.map((r) => (
                  <button
                    key={r}
                    onClick={() => { setDateRange(r); setDateRangeOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-body-md hover:bg-surface-container transition-colors ${
                      r === dateRange ? "bg-primary-fixed text-primary-dark font-medium" : "text-on-surface"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-label-sm text-on-surface-variant mr-1">Filtrar por estado:</span>
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-label-sm transition-colors ${
                  s === statusFilter
                    ? "bg-primary text-white"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 bg-surface-container rounded-lg">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-white text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-white text-on-surface shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Gallery Content */}
      {viewMode === "list" ? (
        <div className="space-y-3">
          {galleryItems.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id}
                className="card p-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Sparkles size={28} className="text-on-surface-variant opacity-40" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${status.bg} ${status.text}`}
                      >
                        <StatusIcon size={12} />
                        {status.label}
                      </span>
                      <span className="text-label-sm text-on-surface uppercase tracking-wider font-bold">
                        {item.title}
                      </span>
                    </div>

                    <p className="text-body-md text-on-surface font-medium mb-1">
                      Generado con {item.model}
                    </p>
                    <p className="text-body-md text-on-surface-variant line-clamp-2 mb-2">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                        <Clock size={12} />
                        {item.date}
                      </span>
                      {item.platforms.length > 0 && (
                        <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                          <Share2 size={12} />
                          {item.platforms.length} redes
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors">
                      <Edit3 size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-error-container text-on-surface-variant hover:text-error transition-colors">
                      <Trash2 size={18} />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-3 gap-4">
          {galleryItems.map((item) => {
            const status = statusConfig[item.status];
            const StatusIcon = status.icon;

            return (
              <div
                key={item.id}
                className="card overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="aspect-square bg-surface-container flex items-center justify-center relative">
                  <Sparkles size={40} className="text-on-surface-variant opacity-30" />
                  <span
                    className={`absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${status.bg} ${status.text}`}
                  >
                    <StatusIcon size={12} />
                    {status.label}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-label-sm text-on-surface uppercase tracking-wider font-bold">
                      {item.title}
                    </span>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 rounded hover:bg-surface-container text-on-surface-variant">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant line-clamp-2 mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
                      <Clock size={12} />
                      {item.date}
                    </span>
                    <span className="text-label-sm text-on-surface">{item.model}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Item Link */}
      <div className="card p-5 border-dashed flex items-center justify-center gap-3 hover:border-primary/30 transition-colors cursor-pointer group">
        <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
          <Plus size={20} className="text-primary group-hover:text-white transition-colors" />
        </div>
        <div>
          <p className="text-body-md text-on-surface font-medium group-hover:text-primary transition-colors">
            Crear Nueva Publicación
          </p>
          <p className="text-label-sm text-on-surface-variant">
            Comienza una nueva generación de imagen con IA
          </p>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-body-md text-on-surface-variant">
          Mostrando {(page - 1) * 5 + 1}-{Math.min(page * 5, totalItems)} de {totalItems} publicaciones
        </p>

        <div className="flex items-center gap-1">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed text-on-surface-variant transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {[1, 2, 3].map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-body-md font-medium transition-colors ${
                p === page
                  ? "bg-primary text-white"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 rounded-lg hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed text-on-surface-variant transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
