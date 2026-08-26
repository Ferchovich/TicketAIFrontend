"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { listCategories, listTickets } from "@/lib/api";
import type { Category, Ticket } from "@/lib/types";
import { formatCurrency, formatDate, monthLabel, monthRange } from "@/lib/format";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryColor } from "@/lib/categoryColor";

type Period = "current" | "previous";

function monthOffset(monthsBack: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
}

function sumImporte(tickets: Ticket[]): number {
  return tickets.reduce((acc, t) => acc + (t.importe_total ?? 0), 0);
}

function reviewNeeded(t: Ticket): boolean {
  if (t.status === "error" || t.status === "pending_category") return true;
  return t.extraction_confidence !== null && t.extraction_confidence !== undefined && t.extraction_confidence < 0.85;
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("current");
  const [categories, setCategories] = useState<Category[]>([]);
  const [recent, setRecent] = useState<Ticket[]>([]);
  const [periodTickets, setPeriodTickets] = useState<Ticket[]>([]);
  const [priorPeriodTickets, setPriorPeriodTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
    listTickets({ page: 1, page_size: 5 })
      .then(({ tickets }) => setRecent(tickets))
      .catch(() => setRecent([]));
  }, []);

  useEffect(() => {
    const selectedOffset = period === "current" ? 0 : 1;
    const selectedRange = monthRange(monthOffset(selectedOffset));
    const priorRange = monthRange(monthOffset(selectedOffset + 1));

    Promise.all([
      listTickets({ fecha_desde: selectedRange.from, fecha_hasta: selectedRange.to, page_size: 200 }),
      listTickets({ fecha_desde: priorRange.from, fecha_hasta: priorRange.to, page_size: 200 }),
    ])
      .then(([selected, prior]) => {
        setPeriodTickets(selected.tickets);
        setPriorPeriodTickets(prior.tickets);
      })
      .catch(() => {
        setPeriodTickets([]);
        setPriorPeriodTickets([]);
      })
      .finally(() => setLoading(false));
  }, [period]);

  const categoryById = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const total = sumImporte(periodTickets);
  const priorTotal = sumImporte(priorPeriodTickets);
  const trendPct = priorTotal > 0 ? Math.round(((total - priorTotal) / priorTotal) * 100) : null;
  const trendUp = trendPct !== null && trendPct >= 0;
  const trendLabel =
    trendPct === null ? "Sin datos del período anterior" : `${trendUp ? "▲" : "▼"} ${Math.abs(trendPct)}% vs. período anterior`;

  const needsReview = periodTickets.filter(reviewNeeded).length;
  const avgConfidence = (() => {
    const withConfidence = periodTickets.filter((t) => t.extraction_confidence !== null && t.extraction_confidence !== undefined);
    if (withConfidence.length === 0) return null;
    const sum = withConfidence.reduce((acc, t) => acc + (t.extraction_confidence ?? 0), 0);
    return sum / withConfidence.length;
  })();

  const breakdown = useMemo(() => {
    const groups = new Map<string, { name: string; color: string; total: number }>();
    for (const t of periodTickets) {
      const key = t.category_id ?? "sin-categoria";
      const name = t.category_id ? categoryById.get(t.category_id)?.name ?? "Categoría eliminada" : "Sin categoría";
      const color = t.category_id ? categoryColor(t.category_id) : "#c7c9d1";
      const entry = groups.get(key) ?? { name, color, total: 0 };
      entry.total += t.importe_total ?? 0;
      groups.set(key, entry);
    }
    const list = [...groups.values()].sort((a, b) => b.total - a.total);
    return list.map((item) => ({
      ...item,
      pct: total > 0 ? Math.round((item.total / total) * 100) : 0,
    }));
  }, [periodTickets, categoryById, total]);

  const topCategoryLabel = breakdown[0] ? `Mayor gasto: ${breakdown[0].name}` : "Sin gastos en el período";

  const periodDate = monthOffset(period === "current" ? 0 : 1);

  return (
    <main className="flex-1 p-8 flex flex-col gap-6 min-w-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-2">Resumen de actividad de facturación</p>
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-[3px]">
          <button
            onClick={() => setPeriod("current")}
            className={`border-none text-[13px] font-medium px-3.5 py-1.5 rounded-md ${
              period === "current" ? "bg-accent text-white" : "bg-transparent text-ink-2"
            }`}
          >
            {monthLabel(monthOffset(0))}
          </button>
          <button
            onClick={() => setPeriod("previous")}
            className={`border-none text-[13px] font-medium px-3.5 py-1.5 rounded-md ${
              period === "previous" ? "bg-accent text-white" : "bg-transparent text-ink-2"
            }`}
          >
            {monthLabel(monthOffset(1))}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total facturado"
          value={loading ? "…" : formatCurrency(total)}
          sub={trendLabel}
          subColor={trendPct === null ? undefined : trendUp ? "#0f6b0f" : "#b3302f"}
        />
        <KpiCard
          label="Tickets procesados"
          value={loading ? "…" : String(periodTickets.length)}
          sub={`${needsReview} pendientes de revisión`}
        />
        <KpiCard
          label="Precisión de extracción"
          value={loading ? "…" : avgConfidence === null ? "—" : `${Math.round(avgConfidence * 100)}%`}
          sub={`${needsReview} tickets requieren revisión manual`}
        />
        <KpiCard
          label="Categorías activas"
          value={String(categories.length)}
          sub={topCategoryLabel}
        />
      </div>

      <div className="grid grid-cols-[1.6fr_1fr] gap-5 items-start">
        <div className="bg-surface border border-border rounded-[10px] p-[22px]">
          <div className="text-sm font-semibold mb-4">Gasto por categoría</div>
          <div className="flex flex-col gap-3.5">
            {breakdown.length === 0 && !loading && (
              <div className="text-sm text-ink-muted">No hay gastos registrados en este período.</div>
            )}
            {breakdown.map((item) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-[9px] h-[9px] rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-[13px] text-ink">{item.name}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[13px] tabular-nums">{formatCurrency(item.total)}</span>
                    <span className="text-xs text-ink-muted w-[30px] text-right">{item.pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#f0efec] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-[22px] flex flex-col">
          <div className="text-sm font-semibold mb-4">Actividad reciente</div>
          <div className="flex flex-col gap-0.5">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center gap-2.5 py-2.5 border-b border-border">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: t.category_id ? categoryColor(t.category_id) : "#c7c9d1" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                    {t.razon_social ?? "Sin proveedor"}
                  </div>
                  <div className="text-xs text-ink-muted">{formatDate(t.fecha_emision)}</div>
                </div>
                <span className="font-mono text-xs text-ink-2 shrink-0">{formatCurrency(t.importe_total)}</span>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
          <Link href="/tickets" className="text-[13px] font-medium mt-3.5">
            Ver todos los tickets →
          </Link>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[10px] p-[22px]">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold">Información de la empresa</div>
        </div>
        <div className="grid grid-cols-3 gap-x-6 gap-y-5">
          <InfoField label="Razón social" value="Nortec Insumos S.R.L." />
          <InfoField label="CUIT" value="30-71234567-8" mono />
          <InfoField label="Condición frente al IVA" value="Responsable Inscripto" />
          <InfoField label="Domicilio fiscal" value="Av. Córdoba 1234, CABA" />
          <InfoField label="Período fiscal actual" value={monthLabel(periodDate)} />
          <InfoField label="Moneda" value="ARS ($)" />
        </div>
      </div>
    </main>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`text-sm mt-1 ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
