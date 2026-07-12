import { BookingsSidebarHeader } from "@/components/bookings-sidebar-header";

export function BookingsSidebar() {
  return (
    <aside
      aria-label="Управление бронями"
      className="w-96 shrink-0 overflow-hidden border-l border-slate-200 bg-white"
    >
      <BookingsSidebarHeader />
    </aside>
  );
}
