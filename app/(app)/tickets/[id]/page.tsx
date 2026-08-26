"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  deleteTicket,
  getTicket,
  getTicketLogs,
  listCategories,
  updateTicket,
} from "@/lib/api";
import type { Category, Ticket, TicketExtractionLog } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { CategoryDot } from "@/components/CategoryDot";

type Tab = "datos" | "ocr" | "audit";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<Tab>("datos");
  const [logs, setLogs] = useState<TicketExtractionLog[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    razon_social: "",
    cuit: "",
    fecha_emision: "",
    numero_comprobante: "",
    subtotal: "",
    iva: "",
    importe_total: "",
    category_id: "",
  });

  useEffect(() => {
    listCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    getTicket(params.id)
      .then((t) => {
        setTicket(t);
        setForm({
          razon_social: t.razon_social ?? "",
          cuit: t.cuit ?? "",
          fecha_emision: t.fecha_emision ? t.fecha_emision.slice(0, 10) : "",
          numero_comprobante: t.numero_comprobante ?? "",
          subtotal: t.subtotal !== null ? String(t.subtotal) : "",
          iva: t.iva !== null ? String(t.iva) : "",
          importe_total: t.importe_total !== null ? String(t.importe_total) : "",
          category_id: t.category_id ?? "",
        });
      })
      .catch(() => setError("No se pudo cargar el ticket."));
  }, [params.id]);

  useEffect(() => {
    if (tab === "audit" && logs === null) {
      getTicketLogs(params.id)
        .then(setLogs)
        .catch(() => setLogs([]));
    }
  }, [tab, logs, params.id]);

  if (error) {
    return (
      <main className="flex-1 p-8">
        <p className="text-sm text-[#b3302f]">{error}</p>
        <Link href="/tickets" className="text-sm">← Volver a tickets</Link>
      </main>
    );
  }

  if (!ticket) {
    return (
      <main className="flex-1 p-8">
        <p className="text-sm text-ink-muted">Cargando…</p>
      </main>
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const updated = await updateTicket(params.id, {
        razon_social: form.razon_social || null,
        cuit: form.cuit || null,
        fecha_emision: form.fecha_emision || null,
        numero_comprobante: form.numero_comprobante || null,
        subtotal: form.subtotal ? Number(form.subtotal) : null,
        iva: form.iva ? Number(form.iva) : null,
        importe_total: form.importe_total ? Number(form.importe_total) : null,
        category_id: form.category_id || null,
        status: "reviewed",
      });
      setTicket(updated);
    } catch {
      setError("No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("¿Seguro que querés eliminar esta factura?")) return;
    setDeleting(true);
    try {
      await deleteTicket(params.id);
      router.push("/tickets");
    } catch {
      setError("No se pudo eliminar el ticket.");
      setDeleting(false);
    }
  }

  const category = form.category_id ? categories.find((c) => c.id === form.category_id) : undefined;

  return (
    <main className="flex-1 p-8 flex flex-col gap-5 min-w-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <Link
            href="/tickets"
            className="w-8 h-8 rounded-lg border border-border bg-surface flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="m-0 text-xl font-semibold tracking-tight">
                Factura #{ticket.id.slice(0, 8).toUpperCase()}
              </h1>
              <StatusBadge status={ticket.status} />
            </div>
            <p className="mt-1 text-[13px] text-ink-2">
              {ticket.razon_social ?? "Sin proveedor"} · {formatDate(ticket.fecha_emision)}
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 border border-border bg-surface text-[#b3302f] text-[13px] font-medium px-3.5 py-2 rounded-lg disabled:opacity-60"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
            </svg>
            Eliminar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="border-none bg-accent text-white text-[13px] font-medium px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[#b3302f]">{error}</p>}

      <div className="grid grid-cols-[1fr_1.15fr] gap-5 items-start">
        <div className="bg-surface border border-border rounded-[10px] p-4 flex flex-col gap-3.5">
          <div className="relative bg-[#f0efec] rounded-lg aspect-3/4 flex items-center justify-center overflow-hidden">
            <InvoicePlaceholder />
          </div>
          <div className="text-xs text-ink-muted flex flex-col gap-0.5">
            <div>Subido el {formatDateTime(ticket.created_at)}</div>
            {!ticket.document_id && <div>No hay una imagen almacenada para este ticket.</div>}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
          <div className="flex border-b border-border">
            <TabButton active={tab === "datos"} onClick={() => setTab("datos")}>
              Datos extraídos
            </TabButton>
            <TabButton active={tab === "ocr"} onClick={() => setTab("ocr")}>
              Texto OCR crudo
            </TabButton>
            <TabButton active={tab === "audit"} onClick={() => setTab("audit")}>
              Log de auditoría
            </TabButton>
          </div>

          {tab === "datos" && (
            <div className="p-5 flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <TextField
                  label="Proveedor"
                  value={form.razon_social}
                  onChange={(v) => setForm((f) => ({ ...f, razon_social: v }))}
                />
                <TextField
                  label="CUIT proveedor"
                  value={form.cuit}
                  onChange={(v) => setForm((f) => ({ ...f, cuit: v }))}
                  mono
                />
                <TextField
                  label="Fecha"
                  type="date"
                  value={form.fecha_emision}
                  onChange={(v) => setForm((f) => ({ ...f, fecha_emision: v }))}
                />
                <TextField
                  label="Número de factura"
                  value={form.numero_comprobante}
                  onChange={(v) => setForm((f) => ({ ...f, numero_comprobante: v }))}
                  mono
                />
                <TextField
                  label="Monto neto"
                  type="number"
                  value={form.subtotal}
                  onChange={(v) => setForm((f) => ({ ...f, subtotal: v }))}
                  mono
                />
                <TextField
                  label="IVA"
                  type="number"
                  value={form.iva}
                  onChange={(v) => setForm((f) => ({ ...f, iva: v }))}
                  mono
                />
              </div>
              <TextField
                label="Monto total"
                type="number"
                value={form.importe_total}
                onChange={(v) => setForm((f) => ({ ...f, importe_total: v }))}
                mono
              />
              <div>
                <FieldLabel>Categoría</FieldLabel>
                <div className="flex items-center gap-1.5 border border-border rounded-[7px] px-3">
                  {category && <CategoryDot categoryId={category.id} />}
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                    className="border-none outline-none bg-transparent text-sm py-2.5 w-full"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <FieldLabel>Confianza de extracción</FieldLabel>
                  <span className="text-xs font-mono text-ink-2">
                    {ticket.extraction_confidence !== null && ticket.extraction_confidence !== undefined
                      ? `${Math.round(ticket.extraction_confidence * 100)}%`
                      : "—"}
                  </span>
                </div>
                <div className="h-1.5 bg-[#f0efec] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0f6b0f]"
                    style={{
                      width: `${
                        ticket.extraction_confidence !== null && ticket.extraction_confidence !== undefined
                          ? Math.round(ticket.extraction_confidence * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {tab === "ocr" && (
            <div className="p-5">
              <div className="text-xs text-ink-muted mb-2.5">
                Texto crudo devuelto por el motor OCR, sin procesar.
              </div>
              <pre className="m-0 bg-bg border border-border rounded-lg p-4 font-mono text-xs leading-[1.7] text-ink-2 whitespace-pre-wrap max-h-[360px] overflow-auto">
                {ticket.raw_text || "No hay texto OCR disponible para este ticket."}
              </pre>
            </div>
          )}

          {tab === "audit" && (
            <div className="px-5 pt-5 pb-1">
              {logs === null && <div className="text-sm text-ink-muted">Cargando…</div>}
              {logs !== null && logs.length === 0 && (
                <div className="text-sm text-ink-muted">No hay eventos de auditoría registrados.</div>
              )}
              {logs?.map((log, i) => (
                <div key={log.id} className="flex gap-3 pb-5">
                  <div className="flex flex-col items-center shrink-0">
                    <span
                      className="w-[9px] h-[9px] rounded-full mt-1"
                      style={{ background: log.success ? "#2a78d6" : "#b3302f" }}
                    />
                    {i < logs.length - 1 && <span className="w-[1.5px] flex-1 bg-border mt-1" />}
                  </div>
                  <div className="pb-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-medium">
                        {log.message || log.stage || "Evento"}
                      </span>
                      {!log.success && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-[#fbeaea] text-[#b3302f]">
                          Error
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">{formatDateTime(log.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 border-none bg-transparent py-3.5 text-[13px] font-medium"
      style={{
        color: active ? "#2a78d6" : "#898781",
        borderBottom: `2px solid ${active ? "#2a78d6" : "transparent"}`,
      }}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-1.5">
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-border rounded-[7px] px-3 py-2.5 text-sm outline-none focus:border-accent ${
          mono ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

function InvoicePlaceholder() {
  return (
    <svg width="220" height="290" viewBox="0 0 220 290" fill="none">
      <rect x="10" y="6" width="200" height="278" rx="4" fill="#ffffff" stroke="#d8d7d1" strokeWidth="1.5" />
      <rect x="30" y="26" width="160" height="10" rx="2" fill="#e4e3de" />
      <rect x="55" y="44" width="110" height="7" rx="2" fill="#eceae4" />
      <line x1="30" y1="66" x2="190" y2="66" stroke="#e4e3de" strokeWidth="1.5" />
      <rect x="30" y="78" width="90" height="6" rx="2" fill="#eceae4" />
      <rect x="150" y="78" width="40" height="6" rx="2" fill="#eceae4" />
      <rect x="30" y="94" width="90" height="6" rx="2" fill="#eceae4" />
      <rect x="150" y="94" width="40" height="6" rx="2" fill="#eceae4" />
      <rect x="30" y="110" width="90" height="6" rx="2" fill="#eceae4" />
      <rect x="150" y="110" width="40" height="6" rx="2" fill="#eceae4" />
      <rect x="30" y="126" width="90" height="6" rx="2" fill="#eceae4" />
      <rect x="150" y="126" width="40" height="6" rx="2" fill="#eceae4" />
      <line x1="30" y1="148" x2="190" y2="148" stroke="#e4e3de" strokeWidth="1.5" />
      <rect x="120" y="160" width="70" height="9" rx="2" fill="#c9c7c0" />
      <rect x="30" y="185" width="160" height="1.5" fill="#eceae4" />
      <rect x="30" y="200" width="160" height="1.5" fill="#eceae4" />
      <rect x="30" y="215" width="160" height="1.5" fill="#eceae4" />
      <rect x="30" y="230" width="120" height="1.5" fill="#eceae4" />
    </svg>
  );
}
