import { Header } from "@/components/header";
import { ReservationsSidebar } from "@/components/reservations-sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Header />

      <main className="flex flex-1">
        <section
          aria-label="Рабочая область"
          className="min-w-0 flex-1 bg-slate-100"
        />

        <ReservationsSidebar />
      </main>
    </div>
  );
}
