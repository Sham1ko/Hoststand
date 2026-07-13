import { addMinutes, format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import type { Reservation } from "@/entities/reservation/model/types";

export function formatReservationTimeRange(reservation: Reservation) {
  const start = parseISO(reservation.reservationDate);
  const end = addMinutes(start, reservation.durationMinutes);
  return `${format(start, "HH:mm")}–${format(end, "HH:mm")}`;
}

export function formatReservationDateLabel(reservation: Reservation) {
  return format(parseISO(reservation.reservationDate), "d MMMM", {
    locale: ru,
  });
}

export function formatGuestsCount(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return `${count} гость`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} гостя`;
  }

  return `${count} гостей`;
}

export function formatGuestPhone(phone: string) {
  const match = phone.match(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (!match) return phone;

  return `+7 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}
