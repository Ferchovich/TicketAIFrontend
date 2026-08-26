export const TICKET_STATUSES = [
  "uploaded",
  "analyzed",
  "pending_category",
  "saved",
  "reviewed",
  "error",
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface Ticket {
  id: string;
  document_id: string | null;
  category_id: string | null;
  cuit: string | null;
  razon_social: string | null;
  importe_total: number | null;
  subtotal: number | null;
  iva: number | null;
  moneda: string | null;
  fecha_emision: string | null;
  tipo_comprobante: string | null;
  numero_comprobante: string | null;
  punto_venta: string | null;
  domicilio_comercial: string | null;
  extraction_confidence: number | null;
  status: TicketStatus | null;
  raw_text?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TicketExtractedData {
  cuit: string | null;
  razon_social: string | null;
  importe_total: number | null;
  subtotal: number | null;
  iva: number | null;
  moneda: string | null;
  fecha_emision: string | null;
  tipo_comprobante: string | null;
  numero_comprobante: string | null;
  punto_venta: string | null;
  domicilio_comercial: string | null;
  categoria_sugerida: string | null;
  texto_crudo_ocr: string | null;
  confianza_extraccion: number | null;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  ticket_count: number;
  total_amount: number;
}

export interface TicketExtractionLog {
  id: string;
  ticket_id: string | null;
  stage: string | null;
  success: boolean;
  message: string | null;
  payload_json: unknown;
  created_at: string | null;
}

export interface Pagination {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
