import {
  ReservationCard,
  type ReservationCardProps,
} from "./reservation-card";

const reservations = [
  {
    id: "reservation-1",
    time: "18:00–22:00",
    dateLabel: "12 июля",
    guestName: "Мадина Ержанова",
    status: "CONFIRMED",
    table: 12,
    floor: 1,
    guests: 8,
    phone: "+7 705 111 22 33",
    note: "День рождения, нужен торт",
  },
  {
    id: "reservation-2",
    time: "19:00–21:00",
    dateLabel: "12 июля",
    guestName: "Айгерим Сатпаева",
    status: "CONFIRMED",
    table: 4,
    floor: 1,
    guests: 3,
    phone: "+7 701 123 45 67",
    note: "У окна, пожалуйста",
  },
  {
    id: "reservation-3",
    time: "20:30–22:00",
    dateLabel: "12 июля",
    guestName: "Данияр Ахметов",
    status: "PENDING",
    table: 9,
    floor: 1,
    guests: 4,
    phone: "+7 702 987 65 43",
  },
  {
    id: "reservation-4",
    time: "21:00–00:00",
    dateLabel: "12 июля",
    guestName: "Арман Бекжанов",
    status: "CONFIRMED",
    table: 21,
    floor: 2,
    guests: 6,
    phone: "+7 707 444 55 66",
    note: "VIP, просили кальян",
  },
] satisfies Array<ReservationCardProps & { id: string }>;

export function ReservationsList() {
  return (
    <div
      aria-label="Список броней"
      className="thin-scroll min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4"
    >
      {reservations.map(({ id, ...reservation }) => (
        <ReservationCard key={id} {...reservation} />
      ))}
    </div>
  );
}
