import { FloorMap } from "@/components/floor-map/floor-map";
import { Header } from "@/components/header";
import { ReservationsSidebar } from "@/components/reservations-sidebar/reservations-sidebar";
import { RestaurantProvider } from "@/features/restaurant/ui/restaurant-provider";

export default function Home() {
  return (
    <RestaurantProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
        <Header />

        <main className="flex min-h-0 flex-1">
          <FloorMap />

          <ReservationsSidebar />
        </main>
      </div>
    </RestaurantProvider>
  );
}
