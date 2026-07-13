import { createRestaurantSeed } from "../data/seed";
import type { RestaurantState } from "../model/types";

const globalStore = globalThis as typeof globalThis & {
  qolayRestaurant?: RestaurantState;
};

export function getRestaurant() {
  globalStore.qolayRestaurant ??= createRestaurantSeed();
  return globalStore.qolayRestaurant;
}

export function saveRestaurant(state: RestaurantState) {
  globalStore.qolayRestaurant = state;
  return state;
}

export function resetRestaurant() {
  globalStore.qolayRestaurant = createRestaurantSeed();
  return globalStore.qolayRestaurant;
}
