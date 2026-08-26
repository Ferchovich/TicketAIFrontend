import type {
  Category,
  Pagination,
  Ticket,
  TicketExtractedData,
  TicketExtractionLog,
  TicketStatus,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  pagination?: Pagination;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: unknown,
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body && !(init.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !envelope.success) {
    throw new ApiError(envelope.message, response.status, envelope.errors);
  }
  return envelope;
}

export interface TicketListFilters {
  page?: number;
  page_size?: number;
  fecha_desde?: string;
  fecha_hasta?: string;
  cuit?: string;
  razon_social?: string;
  categoria_id?: string;
  status?: string;
}

function toQueryString(params: TicketListFilters) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listTickets(
  filters: TicketListFilters = {},
): Promise<{ tickets: Ticket[]; pagination: Pagination }> {
  const envelope = await request<Ticket[]>(`/tickets${toQueryString(filters)}`);
  return { tickets: envelope.data, pagination: envelope.pagination! };
}

export async function getTicket(id: string): Promise<Ticket> {
  const envelope = await request<Ticket>(`/tickets/${id}`);
  return envelope.data;
}

export async function analyzeTicket(file: File): Promise<TicketExtractedData> {
  const formData = new FormData();
  formData.append("image", file);
  const envelope = await request<TicketExtractedData>("/tickets/analyze", {
    method: "POST",
    body: formData,
  });
  return envelope.data;
}

export interface CreateTicketPayload {
  document_id?: string | null;
  category_id?: string | null;
  cuit?: string | null;
  razon_social?: string | null;
  importe_total?: number | null;
  subtotal?: number | null;
  iva?: number | null;
  moneda?: string | null;
  fecha_emision?: string | null;
  tipo_comprobante?: string | null;
  numero_comprobante?: string | null;
  punto_venta?: string | null;
  domicilio_comercial?: string | null;
  extraction_confidence?: number | null;
  raw_text?: string | null;
  ocr_provider?: string;
  status?: TicketStatus;
}

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const envelope = await request<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return envelope.data;
}

export type UpdateTicketPayload = Partial<
  Omit<CreateTicketPayload, "ocr_provider" | "raw_text">
>;

export async function updateTicket(
  id: string,
  payload: UpdateTicketPayload,
): Promise<Ticket> {
  const envelope = await request<Ticket>(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return envelope.data;
}

export async function deleteTicket(id: string): Promise<void> {
  await request<null>(`/tickets/${id}`, { method: "DELETE" });
}

export async function getTicketLogs(id: string): Promise<TicketExtractionLog[]> {
  const envelope = await request<TicketExtractionLog[]>(`/tickets/${id}/logs`);
  return envelope.data;
}

export async function listCategories(): Promise<Category[]> {
  const envelope = await request<Category[]>("/categories");
  return envelope.data;
}

export async function createCategory(payload: {
  name: string;
  description?: string | null;
}): Promise<Category> {
  const envelope = await request<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return envelope.data;
}

export async function updateCategory(
  id: string,
  payload: { name?: string; description?: string | null },
): Promise<Category> {
  const envelope = await request<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return envelope.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await request<null>(`/categories/${id}`, { method: "DELETE" });
}

export { ApiError };
