import { Header } from "@/components/header";
import { RestaurantWorkspace } from "@/components/restaurant-workspace";
import { RestaurantProvider } from "@/client/restaurant/state/restaurant-provider";

export default function Home() {
  return (
    <RestaurantProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
        <Header />

        <RestaurantWorkspace />
      </div>
    </RestaurantProvider>
  );
}
