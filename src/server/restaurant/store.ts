import type { RestaurantState } from "@/entities/restaurant/model/types";

import { createRestaurantSeed } from "@/entities/restaurant/seed/restaurant-seed";

export type RestaurantMutation<T> =
  | { status: "ok"; state: RestaurantState; data: T }
  | { status: "not_found" | "conflict" };

export type RestaurantMutationResult<T> =
  | { status: "ok"; data: T }
  | { status: "not_found" | "conflict" };

const globalStore = globalThis as typeof globalThis & {
  hoststandRestaurant?: RestaurantState;
};

export function getRestaurant() {
  globalStore.hoststandRestaurant ??= createRestaurantSeed();
  return globalStore.hoststandRestaurant;
}

export function mutateRestaurant<T>(
  mutation: (state: RestaurantState) => RestaurantMutation<T>,
): RestaurantMutationResult<T> {
  const result = mutation(getRestaurant());

  if (result.status !== "ok") return result;

  globalStore.hoststandRestaurant = result.state;

  return { status: "ok", data: result.data };
}

export function resetRestaurant() {
  globalStore.hoststandRestaurant = createRestaurantSeed();
  return globalStore.hoststandRestaurant;
}
