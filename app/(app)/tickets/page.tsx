"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listCategories, listTickets } from "@/lib/api";
import type { Category, Ticket } from "@/lib/types";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { STATUS_FILTERS, statusKeyFor } from "@/lib/ticketStatus";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryDot } from "@/components/CategoryDot";
import { UploadModal } from "@/components/UploadModal";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]["key"]>("todos");
  const [showUpload, setShowUpload] = useState(false);

  const categoryById = new Map(categories.map((c) => [c.id, c]));

  function refresh() {
    setLoading(true);
    listTickets({ razon_social: search || undefined, page_size: 100 })
      .then(({ tickets }) => setTickets(tickets))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(refresh, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = tickets.filter((t) => statusFilter === "todos" || statusKeyFor(t.status) === statusFilter);

  return (
    <main className="flex-1 p-8 flex flex-col gap-5 min-w-0">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="m-0 text-[22px] font-semibold tracking-tight">Tickets</h1>
          <p className="mt-1 text-sm text-ink-2">{tickets.length} facturas registradas</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 border-none bg-accent text-white text-sm font-medium px-4 py-2.5 rounded-lg"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva factura
        </button>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 h-[38px] w-[280px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por proveedor..."
            className="border-none outline-none bg-transparent text-[13px] w-full text-ink"
          />
        </div>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-[3px]">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`border-none text-[13px] font-medium px-3 py-1.5 rounded-md ${
                statusFilter === f.key ? "bg-accent text-white" : "bg-transparent text-ink-2"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        <div className="grid grid-cols-[110px_1.6fr_1.1fr_120px_140px_110px] px-5 py-3 border-b border-border text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          <div>Fecha</div>
          <div>Proveedor</div>
          <div>Categoría</div>
          <div>Monto</div>
          <div>Estado</div>
          <div>Confianza</div>
        </div>

        {!loading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-ink-muted text-sm">
            No se encontraron tickets con estos filtros.
          </div>
        )}

        {filtered.map((t) => {
          const category = t.category_id ? categoryById.get(t.category_id) : undefined;
          return (
            <Link
              key={t.id}
              href={`/tickets/${t.id}`}
              className="grid grid-cols-[110px_1.6fr_1.1fr_120px_140px_110px] items-center px-5 py-3 border-b border-border text-[13px] text-ink hover:bg-bg"
            >
              <div className="text-ink-2">{formatDate(t.fecha_emision)}</div>
              <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                {t.razon_social ?? "Sin proveedor"}
              </div>
              <div className="flex items-center gap-1.5">
                {t.category_id && <CategoryDot categoryId={t.category_id} />}
                <span className="text-ink-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {category?.name ?? "Sin categoría"}
                </span>
              </div>
              <div className="font-mono tabular-nums">{formatCurrency(t.importe_total)}</div>
              <div>
                <StatusBadge status={t.status} />
              </div>
              <div className="font-mono text-ink-2">{formatPercent(t.extraction_confidence)}</div>
            </Link>
          );
        })}
      </div>

      {showUpload && (
        <UploadModal
          categories={categories}
          onClose={() => setShowUpload(false)}
          onCreated={refresh}
        />
      )}
    </main>
  );
}
