import { resetRestaurant } from "@/server/restaurant/store";

export const dynamic = "force-dynamic";

export function POST() {
  return Response.json({ data: resetRestaurant() });
}
