import type { TableStatus } from "@/entities/table/model/types";

export const tableStatusAppearance: Record<
  TableStatus,
  { fill: string; stroke: string; text: string; label: string }
> = {
  FREE: {
    fill: "#ecfdf5",
    stroke: "#10b981",
    text: "#047857",
    label: "Свободен",
  },
  OCCUPIED: {
    fill: "#fff1f2",
    stroke: "#fb7185",
    text: "#be123c",
    label: "Занят",
  },
  RESERVED: {
    fill: "#fffbeb",
    stroke: "#f59e0b",
    text: "#b45309",
    label: "Забронирован",
  },
  BANQUET: {
    fill: "#f5f3ff",
    stroke: "#8b5cf6",
    text: "#6d28d9",
    label: "Банкет",
  },
  MANUAL_BLOCKED: {
    fill: "#f1f5f9",
    stroke: "#64748b",
    text: "#475569",
    label: "Заблокирован",
  },
  INACTIVE: {
    fill: "#f8fafc",
    stroke: "#94a3b8",
    text: "#64748b",
    label: "Неактивен",
  },
};
