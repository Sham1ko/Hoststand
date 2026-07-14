import * as z from "zod";

import {
  diningTableSchema,
  type CreateTableInput,
  type TablePatchInput,
} from "@/entities/table/model/schemas";
import type { DiningTable } from "@/entities/table/model/types";
import {
  tableZoneSchema,
  type CreateZoneInput,
  type ZonePatchInput,
} from "@/entities/zone/model/schemas";
import type { TableZone } from "@/entities/zone/model/types";
import {
  reservationSchema,
  type CreateReservationInput,
} from "@/entities/reservation/model/schemas";
import type {
  Reservation,
  ReservationAction,
} from "@/entities/reservation/model/types";
import { restaurantStateSchema } from "@/entities/restaurant/model/schemas";
import type { RestaurantState } from "@/entities/restaurant/model/types";

export interface RestaurantRepository {
  loadRestaurant(): Promise<RestaurantState>;
  createReservation(input: CreateReservationInput): Promise<Reservation>;
  applyReservationAction(
    reservationId: string,
    action: ReservationAction,
  ): Promise<Reservation>;
  createTable(input: CreateTableInput): Promise<DiningTable>;
  patchTable(tableId: string, patch: TablePatchInput): Promise<DiningTable>;
  deleteTable(tableId: string): Promise<void>;
  createZone(input: CreateZoneInput): Promise<TableZone>;
  patchZone(zoneId: string, patch: ZonePatchInput): Promise<TableZone>;
  deleteZone(zoneId: string): Promise<void>;
  resetDemo(): Promise<RestaurantState>;
  saveActiveFloor?(floorId: string): Promise<void>;
}

type Fetcher = typeof fetch;

async function readDataResponse<T>(
  response: Response,
  schema: z.ZodType<T>,
) {
  if (!response.ok) {
    throw new Error(`Restaurant request failed with status ${response.status}`);
  }

  const body = (await response.json().catch(() => null)) as unknown;
  const result = z.object({ data: schema }).strict().safeParse(body);

  if (!result.success) {
    throw new Error("Restaurant response has an invalid shape");
  }

  return result.data.data;
}

async function requireSuccessfulResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`Restaurant request failed with status ${response.status}`);
  }
}

function jsonRequest(method: "POST" | "PATCH", body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function resourceUrl(resource: "reservations" | "tables" | "zones", id: string) {
  return `/api/${resource}/${encodeURIComponent(id)}`;
}

export function createHttpRestaurantRepository(
  fetcher: Fetcher = fetch,
): RestaurantRepository {
  return {
    async loadRestaurant() {
      return readDataResponse(
        await fetcher("/api/restaurant", { cache: "no-store" }),
        restaurantStateSchema,
      );
    },
    async createReservation(input) {
      return readDataResponse(
        await fetcher(
          "/api/reservations",
          jsonRequest("POST", input),
        ),
        reservationSchema,
      );
    },
    async applyReservationAction(reservationId, action) {
      return readDataResponse(
        await fetcher(
          resourceUrl("reservations", reservationId),
          jsonRequest("PATCH", { action }),
        ),
        reservationSchema,
      );
    },
    async createTable(input) {
      return readDataResponse(
        await fetcher("/api/tables", jsonRequest("POST", input)),
        diningTableSchema,
      );
    },
    async patchTable(tableId, patch) {
      return readDataResponse(
        await fetcher(
          resourceUrl("tables", tableId),
          jsonRequest("PATCH", patch),
        ),
        diningTableSchema,
      );
    },
    async deleteTable(tableId) {
      await requireSuccessfulResponse(
        await fetcher(resourceUrl("tables", tableId), { method: "DELETE" }),
      );
    },
    async createZone(input) {
      return readDataResponse(
        await fetcher("/api/zones", jsonRequest("POST", input)),
        tableZoneSchema,
      );
    },
    async patchZone(zoneId, patch) {
      return readDataResponse(
        await fetcher(
          resourceUrl("zones", zoneId),
          jsonRequest("PATCH", patch),
        ),
        tableZoneSchema,
      );
    },
    async deleteZone(zoneId) {
      await requireSuccessfulResponse(
        await fetcher(resourceUrl("zones", zoneId), { method: "DELETE" }),
      );
    },
    async resetDemo() {
      return readDataResponse(
        await fetcher("/api/restaurant/reset", { method: "POST" }),
        restaurantStateSchema,
      );
    },
  };
}
