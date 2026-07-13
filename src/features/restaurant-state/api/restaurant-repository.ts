import { createRestaurantSeed } from "../data/seed";
import type { RestaurantState } from "../model/types";

export const RESTAURANT_STORAGE_KEY = "qolay:restaurant:v1";

const RESTAURANT_STORAGE_VERSION = 1;

export interface RestaurantRepository {
  loadRestaurant(): Promise<RestaurantState>;
  saveRestaurant(state: RestaurantState): Promise<void>;
  resetDemo(): Promise<RestaurantState>;
}

type StoredRestaurantState = {
  version: number;
  data: RestaurantState;
};

function isRestaurantState(value: unknown): value is RestaurantState {
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

function readStoredRestaurantState(value: string | null) {
  if (!value) return null;

  try {
    const stored = JSON.parse(value) as Partial<StoredRestaurantState>;

    if (
      stored.version !== RESTAURANT_STORAGE_VERSION ||
      !isRestaurantState(stored.data)
    ) {
      return null;
    }

    return stored.data;
  } catch {
    return null;
  }
}

export function createLocalStorageRestaurantRepository(
  storage: Storage,
): RestaurantRepository {
  async function saveRestaurant(state: RestaurantState) {
    try {
      storage.setItem(
        RESTAURANT_STORAGE_KEY,
        JSON.stringify({
          version: RESTAURANT_STORAGE_VERSION,
          data: state,
        } satisfies StoredRestaurantState),
      );
    } catch {
      // The in-memory state remains usable when browser storage is unavailable.
    }
  }

  return {
    async loadRestaurant() {
      let stored: RestaurantState | null = null;

      try {
        stored = readStoredRestaurantState(
          storage.getItem(RESTAURANT_STORAGE_KEY),
        );
      } catch {
        stored = null;
      }

      if (stored) return stored;

      const seed = createRestaurantSeed();
      await saveRestaurant(seed);
      return seed;
    },
    saveRestaurant,
    async resetDemo() {
      const seed = createRestaurantSeed();
      await saveRestaurant(seed);
      return seed;
    },
  };
}
