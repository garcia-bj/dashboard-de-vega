"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/store/auth";
import { api, type PublicationOut } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft, ChevronRight, CalendarDays, Clock, CheckCircle2,
  AlertCircle, Loader2, ImageIcon, Share2, Facebook, Instagram,
  ExternalLink, X, Layers,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
function toAbs(url: string) {
  if (!url) return url;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

const STATUS_DOT: Record<string, string> = {
  scheduled:  "bg-blue-400",
  pending:    "bg-blue-400",
  generating: "bg-amber-400",
  generated:  "bg-amber-400",
  publishing: "bg-orange-400",
  published:  "bg-emerald-400",
  failed:     "bg-destructive",
  draft:      "bg-muted-foreground/50",
};

const STATUS_META: Record<string, { label: string; variant: "success" | "warning" | "ghost" | "default" | "destructive" }> = {
  scheduled:  { label: "Programada",  variant: "default" },
  pending:    { label: "Pendiente",   variant: "default" },
  generating: { label: "Generando",   variant: "warning" },
  generated:  { label: "Lista",       variant: "warning" },
  publishing: { label: "Publicando",  variant: "warning" },
  published:  { label: "Publicada",   variant: "success" },
  failed:     { label: "Falló",       variant: "destructive" },
  draft:      { label: "Borrador",    variant: "ghost" },
};

const TARGET_ICON: Record<string, React.ElementType> = {
  facebook_feed:   Facebook,
  facebook_story:  Facebook,
  instagram_feed:  Instagram,
  instagram_story: Instagram,
};

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEK_DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function CalendarPage() {
  const token = useAuthStore((s) => s.token)
    || (typeof window !== "undefined" ? localStorage.getItem("token") : null);
  const [pubs, setPubs] = useState<PublicationOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(() => dateKey(new Date()));

  useEffect(() => {
    if (!token) return;
    api.publications.list(token)
      .then(setPubs).catch(() => {}).finally(() => setLoading(false));
  }, [token]);

  const pubsByDate = useMemo(() => {
    const map: Record<string, PublicationOut[]> = {};
    pubs.forEach((p) => {
      const k = dateKey(new Date(p.scheduled_at));
      if (!map[k]) map[k] = [];
      map[k].push(p);
    });
    return map;
  }, [pubs]);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay   = new Date(year, month, 1);
  const lastDay    = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0
  const totalCells  = startOffset + lastDay.getDate();
  const totalRows   = Math.ceil(totalCells / 7);
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
    ...Array(totalRows * 7 - totalCells).fill(null),
  ];

  const today    = new Date();
  const todayKey = dateKey(today);

  const selectedPubs = selectedDay ? (pubsByDate[selectedDay] ?? []) : [];

  // Overall stats
  const thisMonthPubs = pubs.filter((p) => {
    const d = new Date(p.scheduled_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <div className="max-w-7xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Calendario</h1>
          <p className="text-sm text-muted-foreground">Historial y programación de publicaciones</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="h-8 w-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[148px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="h-8 w-8 rounded-lg border border-border hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight size={16} />
          </button>
          <button onClick={() => { setViewDate(new Date()); setSelectedDay(todayKey); }}
            className="h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            Hoy
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Este mes",    value: thisMonthPubs.length,                                             color: "text-foreground",    bg: "" },
          { label: "Programadas", value: pubs.filter((p) => p.status === "scheduled").length,              color: "text-blue-400",      bg: "border-blue-500/20" },
          { label: "Publicadas",  value: pubs.filter((p) => p.status === "published").length,              color: "text-emerald-400",   bg: "border-emerald-500/20" },
          { label: "Fallidas",    value: pubs.filter((p) => p.status === "failed").length,                 color: "text-destructive",   bg: "border-destructive/20" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border bg-card px-4 py-3", s.bg || "border-border")}>
            <p className={cn("text-2xl font-bold", s.color)}>{loading ? "—" : s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="h-9 flex items-center justify-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-72">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {cells.map((day, idx) => {
                if (day === null) {
                  return (
                    <div key={`e-${idx}`}
                      className="min-h-[68px] border-b border-r border-border/30 bg-muted/10" />
                  );
                }
                const key = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const dayPubs = pubsByDate[key] ?? [];
                const isToday    = key === todayKey;
                const isSelected = key === selectedDay;
                const isPast     = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                return (
                  <button key={key} onClick={() => setSelectedDay(isSelected ? null : key)}
                    className={cn(
                      "min-h-[68px] p-1.5 text-left border-b border-r border-border/30 transition-colors relative",
                      isSelected ? "bg-primary/8 ring-1 ring-inset ring-primary/30" : "hover:bg-muted/60",
                      isPast && !isToday && "opacity-55",
                    )}
                  >
                    <span className={cn(
                      "inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold mb-1 leading-none",
                      isToday ? "bg-primary text-white" : isSelected ? "text-primary" : "text-foreground"
                    )}>
                      {day}
                    </span>
                    {/* Publication dots */}
                    <div className="flex flex-wrap gap-[2px]">
                      {dayPubs.slice(0, 5).map((p, i) => (
                        <span key={i} className={cn("w-[6px] h-[6px] rounded-full", STATUS_DOT[p.status] ?? "bg-muted-foreground")} />
                      ))}
                      {dayPubs.length > 5 && (
                        <span className="text-[8px] text-muted-foreground leading-none self-end">+{dayPubs.length - 5}</span>
                      )}
                    </div>
                    {dayPubs.length > 0 && (
                      <span className="absolute bottom-1 right-1 text-[9px] text-muted-foreground font-medium">
                        {dayPubs.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 px-4 py-2.5 border-t border-border bg-muted/20">
            {[
              { dot: "bg-blue-400",    label: "Programada" },
              { dot: "bg-amber-400",   label: "En proceso" },
              { dot: "bg-emerald-400", label: "Publicada" },
              { dot: "bg-destructive", label: "Fallida" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full", l.dot)} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
          {!selectedDay ? (
            <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3">
              <CalendarDays size={36} className="opacity-15" />
              <p className="text-sm text-center">Selecciona un día<br />para ver sus publicaciones</p>
            </div>
          ) : (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground capitalize">
                    {new Date(selectedDay + "T12:00:00").toLocaleDateString("es", {
                      weekday: "long", day: "numeric", month: "long"
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPubs.length === 0
                      ? "Sin publicaciones"
                      : `${selectedPubs.length} publicación${selectedPubs.length !== 1 ? "es" : ""}`}
                  </p>
                </div>
                <button onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <X size={14} />
                </button>
              </div>

              {/* Publications list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {selectedPubs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                    <ImageIcon size={28} className="opacity-15" />
                    <p className="text-xs">Nada programado para este día</p>
                  </div>
                ) : (
                  selectedPubs.map((pub) => {
                    const time = new Date(pub.scheduled_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
                    const s = STATUS_META[pub.status] ?? { label: pub.status, variant: "ghost" as const };
                    const results = pub.meta_data?.publish_results;

                    return (
                      <div key={pub.id} className="rounded-xl bg-muted/50 border border-border/50 p-2.5 hover:bg-muted/80 transition-colors">
                        <div className="flex items-start gap-2.5">
                          {/* Thumbnail */}
                          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-border bg-muted">
                            {pub.image_url
                              ? <img src={toAbs(pub.image_url)} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon size={14} className="text-muted-foreground opacity-50" />
                                </div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <p className="text-xs font-semibold text-foreground truncate leading-tight">{pub.title}</p>
                              {pub.meta_data?.carousel && (
                                <span className="flex-shrink-0 text-muted-foreground"><Layers size={10} /></span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Clock size={9} />{time}
                              </span>
                              <Badge variant={s.variant} className="text-[9px] py-0 h-[16px]">{s.label}</Badge>
                            </div>
                            {/* Targets */}
                            <div className="flex items-center gap-1 mt-1">
                              {pub.targets.map((t) => {
                                const Icon = TARGET_ICON[t] ?? Share2;
                                return <Icon key={t} size={10} className="text-muted-foreground" />;
                              })}
                            </div>
                          </div>
                        </div>
                        {/* Permalink links */}
                        {results && results.filter((r) => r.permalink).length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border/40 flex flex-wrap gap-2">
                            {results.filter((r) => r.permalink).map((r) => (
                              <a key={r.target} href={r.permalink!} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-primary hover:underline font-medium">
                                <ExternalLink size={9} />
                                Ver en {r.target.includes("instagram") ? "Instagram" : "Facebook"}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
