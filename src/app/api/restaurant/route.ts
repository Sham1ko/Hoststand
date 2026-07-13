import { getRestaurant } from "@/features/restaurant-state/server/restaurant-store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ data: getRestaurant() });
}
