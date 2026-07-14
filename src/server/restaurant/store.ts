import type { RestaurantState } from "@/entities/restaurant/model/types";

import { createRestaurantSeed } from "./seed/restaurant-seed";

export type RestaurantMutation<T> =
  | { status: "ok"; state: RestaurantState; data: T }
  | { status: "not_found" | "conflict" };

export type RestaurantMutationResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_found" | "conflict" };

const globalStore = globalThis as typeof globalThis & {
  qolayRestaurant?: RestaurantState;
};

export function getRestaurant() {
  globalStore.qolayRestaurant ??= createRestaurantSeed();
  return globalStore.qolayRestaurant;
}

export function mutateRestaurant<T>(
  mutation: (state: RestaurantState) => RestaurantMutation<T>,
): RestaurantMutationResult<T> {
  const result = mutation(getRestaurant());

  if (result.status !== "ok") return result;

  globalStore.qolayRestaurant = result.state;

  return { status: "ok", data: result.data };
}

export function resetRestaurant() {
  globalStore.qolayRestaurant = createRestaurantSeed();
  return globalStore.qolayRestaurant;
}
