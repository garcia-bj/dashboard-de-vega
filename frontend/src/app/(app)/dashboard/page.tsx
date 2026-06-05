"use client";

import Link from "next/link";
import {
  Wand2,
  CalendarCheck,
  ImageIcon,
  Share2,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Facebook,
  Instagram,
  Plus,
} from "lucide-react";

const metrics = [
  {
    label: "Imágenes Generadas",
    value: "847",
    change: "+12%",
    icon: Wand2,
    color: "bg-primary-fixed text-primary",
  },
  {
    label: "Publicaciones Hoy",
    value: "3",
    change: "2 pendientes",
    icon: CalendarCheck,
    color: "bg-secondary-fixed text-secondary-dark",
  },
  {
    label: "Programadas",
    value: "12",
    change: "esta semana",
    icon: Clock,
    color: "bg-surface-container-high text-tertiary-dark",
  },
  {
    label: "Alcance Total",
    value: "24.5K",
    change: "+8.3%",
    icon: TrendingUp,
    color: "bg-primary-fixed-dim text-primary-dark",
  },
];

const platforms = [
  {
    name: "Facebook",
    icon: Facebook,
    status: "Conectado",
    publications: 28,
    connected: true,
  },
  {
    name: "Instagram",
    icon: Instagram,
    status: "Conectado",
    publications: 42,
    connected: true,
  },
  {
    name: "Instagram Stories",
    icon: Instagram,
    status: "Conectado",
    publications: 15,
    connected: true,
  },
];

const nextPublications = [
  {
    id: "1",
    title: "Viernes de Promo",
    prompt: "Imagen vibrante de un plato gourmet con luces de neón y ambiente festivo",
    model: "Gemini",
    time: "Hoy, 18:00",
    status: "scheduled",
    targets: ["facebook_feed", "instagram_feed"],
  },
  {
    id: "2",
    title: "Sábado Especial",
    prompt: "Foto minimalista de un cóctel artesanal con frutas tropicales",
    model: "DALL·E 3",
    time: "Mañana, 12:00",
    status: "generating",
    targets: ["instagram_story"],
  },
  {
    id: "3",
    title: "Domingo Relax",
    prompt: "Ambiente acogedor de terraza al atardecer, tonos cálidos",
    model: "Flux",
    time: "Domingo, 10:00",
    status: "draft",
    targets: ["facebook_feed", "instagram_feed", "instagram_story"],
  },
];

const statusStyles: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  scheduled: { bg: "bg-primary-fixed", text: "text-primary-dark", icon: Clock },
  generating: { bg: "bg-secondary-fixed", text: "text-secondary-dark", icon: Wand2 },
  published: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle2 },
  failed: { bg: "bg-error-container", text: "text-error", icon: AlertCircle },
  draft: { bg: "bg-surface-container", text: "text-on-surface-variant", icon: AlertCircle },
};

const statusLabels: Record<string, string> = {
  scheduled: "Programada",
  generating: "Generando",
  published: "Publicada",
  failed: "Falló",
  draft: "Borrador",
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="card p-8">
        <h1 className="text-display-lg text-on-surface mb-2">De Vega</h1>
        <p className="text-body-lg text-on-surface-variant max-w-2xl">
          Genera imágenes con inteligencia artificial y publica automáticamente en tus redes sociales.
          Programa, crea y distribuye sin esfuerzo.
        </p>
        <div className="flex gap-3 mt-6">
          <Link href="/generate" className="btn-primary flex items-center gap-2">
            <Plus size={18} />
            Nueva Publicación
          </Link>
          <Link href="/schedule" className="btn-secondary">
            Ver Calendario
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.label} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${metric.color}`}>
                <metric.icon size={22} />
              </div>
              <span className="text-label-sm text-secondary flex items-center gap-1">
                <ArrowUpRight size={14} />
                {metric.change}
              </span>
            </div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-wider">
              {metric.label}
            </p>
            <p className="text-display-lg text-on-surface mt-2">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Next Publications - takes 2/3 */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-title-md text-on-surface">Próximas Publicaciones</h3>
            <Link href="/schedule" className="btn-tertiary text-body-md">
              Ver todas
            </Link>
          </div>

          <div className="space-y-4">
            {nextPublications.map((pub) => {
              const StatusIcon = statusStyles[pub.status]?.icon || Clock;
              return (
                <div
                  key={pub.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-surface-low hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={22} className="text-on-surface-variant" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-body-lg font-semibold text-on-surface">
                        {pub.title}
                      </h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${
                          statusStyles[pub.status].bg
                        } ${statusStyles[pub.status].text}`}
                      >
                        <StatusIcon size={12} />
                        {statusLabels[pub.status]}
                      </span>
                    </div>
                    <p className="text-body-md text-on-surface-variant truncate mb-2">
                      {pub.prompt}
                    </p>
                    <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Wand2 size={12} />
                        {pub.model}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {pub.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 size={12} />
                        {pub.targets.length} redes
                      </span>
                    </div>
                  </div>

                  <ArrowUpRight
                    size={18}
                    className="text-on-surface-variant flex-shrink-0 mt-1"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Platforms Status - takes 1/3 */}
        <div className="card p-6">
          <h3 className="text-title-md text-on-surface mb-6">Conexiones</h3>

          <div className="space-y-4">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="p-4 rounded-xl bg-surface-low"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                    <platform.icon size={22} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-semibold text-on-surface">
                      {platform.name}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 text-label-sm ${
                        platform.connected
                          ? "text-green-600"
                          : "text-on-surface-variant"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          platform.connected ? "bg-green-500" : "bg-outline"
                        }`}
                      />
                      {platform.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body-md text-on-surface-variant">
                    {platform.publications} publicaciones
                  </span>
                  <Link
                    href="/settings"
                    className="text-label-sm text-primary hover:text-primary-hover"
                  >
                    Gestionar
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/settings"
            className="btn-secondary w-full mt-6 text-center flex items-center justify-center gap-2"
          >
            <Plus size={16} />
            Conectar cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
