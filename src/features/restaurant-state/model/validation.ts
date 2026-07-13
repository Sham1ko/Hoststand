import type { RestaurantState } from "./types";

export function isRestaurantState(value: unknown): value is RestaurantState {
  if (!value || typeof value !== "object") return false;

  const state = value as Partial<RestaurantState>;

  return (
    Array.isArray(state.floors) &&
    Array.isArray(state.zones) &&
    Array.isArray(state.tables) &&
    Array.isArray(state.reservations) &&
    typeof state.activeFloorId === "string" &&
    state.floors.some(
      (floor) =>
        floor.id === state.activeFloorId &&
        typeof floor.isActive === "boolean" &&
        floor.isActive,
    )
  );
}
