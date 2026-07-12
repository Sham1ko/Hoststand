import { ReservationsList } from "./reservations-list";
import { ReservationsSidebarHeader } from "./reservations-sidebar-header";

export function ReservationsSidebar() {
  return (
    <aside
      aria-label="Управление бронями"
      className="flex min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
    >
      <ReservationsSidebarHeader />
      <ReservationsList />
    </aside>
  );
}
