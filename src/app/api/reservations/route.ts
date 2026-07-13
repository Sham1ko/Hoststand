import { parseISO } from "date-fns";

import { createReservationsSeed } from "@/features/reservations/data/seed";
import {
  filterReservationsByDate,
  getReservationStatusCounts,
} from "@/features/reservations/model/selectors";
import type { ReservationsResponse } from "@/features/reservations/model/types";

export function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  const allReservations = createReservationsSeed();
  const reservations = date
    ? filterReservationsByDate(allReservations, parseISO(date))
    : allReservations;
  const response: ReservationsResponse = {
    data: reservations,
    meta: {
      statusCounts: getReservationStatusCounts(reservations),
    },
  };

  return Response.json(response);
}
