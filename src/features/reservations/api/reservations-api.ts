import type {
  ReservationAction,
  ReservationsResponse,
} from "../model/types";

export async function getReservations(
  dateParam: string,
  signal?: AbortSignal,
) {
  let response: Response;

  try {
    response = await fetch(`/api/reservations?date=${dateParam}`, { signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return null;
    throw error;
  }

  if (!response.ok) return null;

  return (await response.json()) as ReservationsResponse;
}

export async function updateReservationAction(
  reservationId: string,
  action: ReservationAction,
  dateParam: string,
) {
  const response = await fetch(
    `/api/reservations/${reservationId}?date=${dateParam}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    },
  );

  if (!response.ok) return null;

  return (await response.json()) as ReservationsResponse;
}
