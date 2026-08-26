import type { TicketStatus } from "./types";

export type StatusKey = "verificado" | "pendiente" | "error";

interface StatusMeta {
  key: StatusKey;
  label: string;
  bg: string;
  text: string;
}

const STATUS_META: Record<StatusKey, StatusMeta> = {
  verificado: { key: "verificado", label: "Verificado", bg: "#e7f5e7", text: "#0f6b0f" },
  pendiente: { key: "pendiente", label: "Pendiente", bg: "#fef3da", text: "#92650a" },
  error: { key: "error", label: "Error", bg: "#fbeaea", text: "#b3302f" },
};

export function statusKeyFor(status: TicketStatus | null | undefined): StatusKey {
  if (status === "reviewed") return "verificado";
  if (status === "error") return "error";
  return "pendiente";
}

export function statusMetaFor(status: TicketStatus | null | undefined): StatusMeta {
  return STATUS_META[statusKeyFor(status)];
}

export const STATUS_FILTERS: { key: "todos" | StatusKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "verificado", label: "Verificado" },
  { key: "pendiente", label: "Pendiente" },
  { key: "error", label: "Error" },
];
