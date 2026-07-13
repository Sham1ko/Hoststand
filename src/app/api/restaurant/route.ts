import { getRestaurant } from "@/features/restaurant/server/restaurant-store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ data: getRestaurant() });
}
