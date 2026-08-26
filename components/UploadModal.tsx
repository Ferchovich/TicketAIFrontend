"use client";

import { useRef, useState } from "react";
import { analyzeTicket, createTicket } from "@/lib/api";
import type { Category, TicketExtractedData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { Modal, ModalHeader } from "./Modal";
import { CategoryDot } from "./CategoryDot";

type Step = "idle" | "uploading" | "processing" | "done" | "error";

export function UploadModal({
  categories,
  onClose,
  onCreated,
}: {
  categories: Category[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [step, setStep] = useState<Step>("idle");
  const [fileName, setFileName] = useState("");
  const [extracted, setExtracted] = useState<TicketExtractedData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedCategory = extracted?.categoria_sugerida
    ? categories.find((c) => c.name.toLowerCase() === extracted.categoria_sugerida?.toLowerCase())
    : undefined;

  async function handleFile(file: File) {
    setFileName(file.name);
    setStep("uploading");
    try {
      setStep("processing");
      const data = await analyzeTicket(file);
      setExtracted(data);
      setStep("done");
    } catch {
      setErrorMessage("No se pudo analizar la factura. Probá con otra imagen.");
      setStep("error");
    }
  }

  async function handleSave() {
    if (!extracted) return;
    setSaving(true);
    try {
      await createTicket({
        category_id: suggestedCategory?.id ?? null,
        cuit: extracted.cuit,
        razon_social: extracted.razon_social,
        importe_total: extracted.importe_total,
        subtotal: extracted.subtotal,
        iva: extracted.iva,
        moneda: extracted.moneda,
        fecha_emision: extracted.fecha_emision,
        tipo_comprobante: extracted.tipo_comprobante,
        numero_comprobante: extracted.numero_comprobante,
        punto_venta: extracted.punto_venta,
        domicilio_comercial: extracted.domicilio_comercial,
        extraction_confidence: extracted.confianza_extraccion,
        raw_text: extracted.texto_crudo_ocr,
        ocr_provider: "mock",
        status: "saved",
      });
      onCreated();
      onClose();
    } catch {
      setErrorMessage("No se pudo guardar la factura. Intentá de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <ModalHeader title="Nueva factura" onClose={onClose} />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {step === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border border-dashed border-border rounded-[10px] px-5 py-9 text-center cursor-pointer"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
            <path d="M16 16l-4-4-4 4" />
            <path d="M12 12v9" />
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
          </svg>
          <div className="text-sm font-medium">Arrastrá una imagen o hacé clic para seleccionar</div>
          <div className="text-xs text-ink-muted mt-1.5">Formatos: JPG, PNG, PDF · Máx. 10MB</div>
          <div className="inline-block mt-4 border border-border bg-bg text-[13px] font-medium px-4 py-2 rounded-[7px]">
            Seleccionar archivo
          </div>
        </div>
      )}

      {(step === "uploading" || step === "processing") && (
        <div className="py-9 px-2 text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" className="mx-auto mb-3.5 animate-spin">
            <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
            <path d="M21 12a9 9 0 0 0-9-9" />
          </svg>
          <div className="text-sm font-medium">
            {step === "uploading" ? `Subiendo ${fileName}…` : "Extrayendo datos con OCR…"}
          </div>
          <div className="text-xs text-ink-muted mt-1.5">Motor: extractor simulado (mock OCR)</div>
        </div>
      )}

      {step === "error" && (
        <div className="py-9 px-2 text-center">
          <div className="text-sm text-[#b3302f]">{errorMessage}</div>
          <button
            onClick={() => setStep("idle")}
            className="mt-4 border border-border bg-surface text-ink-2 text-sm font-medium px-4 py-2 rounded-lg"
          >
            Intentar de nuevo
          </button>
        </div>
      )}

      {step === "done" && extracted && (
        <div>
          <div className="flex items-center gap-2 bg-[#e7f5e7] text-[#0f6b0f] text-xs font-medium px-3 py-2 rounded-[7px] mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            Extracción completada — confianza{" "}
            {extracted.confianza_extraccion !== null ? Math.round(extracted.confianza_extraccion * 100) : "—"}%
          </div>
          <div className="flex flex-col gap-3">
            <Field label="Proveedor" value={extracted.razon_social ?? "—"} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha" value={formatDate(extracted.fecha_emision)} />
              <Field label="Monto total" value={formatCurrency(extracted.importe_total)} mono />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-1">
                Categoría sugerida
              </div>
              <div className="flex items-center gap-1.5 border border-border rounded-[7px] px-3 py-2.5 text-sm">
                {suggestedCategory ? (
                  <>
                    <CategoryDot categoryId={suggestedCategory.id} />
                    {suggestedCategory.name}
                  </>
                ) : (
                  <span className="text-ink-muted">Sin sugerencia — se asignará al guardar</span>
                )}
              </div>
            </div>
          </div>
          {errorMessage && <div className="text-xs text-[#b3302f] mt-3">{errorMessage}</div>}
          <div className="flex gap-2.5 mt-5">
            <button
              onClick={onClose}
              className="flex-1 border border-border bg-surface text-ink-2 text-sm font-medium py-2.5 rounded-lg"
            >
              Revisar más tarde
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 border-none bg-accent text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar factura"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted mb-1">{label}</div>
      <div className={`border border-border rounded-[7px] px-3 py-2.5 text-sm ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}
