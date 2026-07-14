import { getRestaurant } from "@/server/restaurant/store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ data: getRestaurant() });
}
