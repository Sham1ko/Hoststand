import { isRestaurantState } from "@/features/restaurant-state/model/validation";
import {
  getRestaurant,
  saveRestaurant,
} from "@/features/restaurant-state/server/restaurant-store";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ data: getRestaurant() });
}

export async function PUT(request: Request) {
  const body = (await request.json().catch(() => null)) as unknown;

  if (!isRestaurantState(body)) {
    return Response.json(
      { error: "Invalid restaurant state" },
      { status: 400 },
    );
  }

  return Response.json({ data: saveRestaurant(body) });
}
