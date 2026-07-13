import { resetRestaurant } from "@/features/restaurant/server/restaurant-store";

export const dynamic = "force-dynamic";

export function POST() {
  return Response.json({ data: resetRestaurant() });
}
