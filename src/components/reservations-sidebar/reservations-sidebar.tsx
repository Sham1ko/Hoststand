import { ReservationsSidebarHeader } from "./reservations-sidebar-header";

export function ReservationsSidebar() {
  return (
    <aside
      aria-label="Управление бронями"
      className="w-96 shrink-0 overflow-hidden border-l border-slate-200 bg-white"
    >
      <ReservationsSidebarHeader />
    </aside>
  );
}
