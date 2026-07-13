import { createRestaurantSeed } from "../data/seed";
import type { RestaurantState } from "../model/types";
import { isRestaurantState } from "../model/validation";

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

type Fetcher = typeof fetch;

type RestaurantResponse = {
  data: RestaurantState;
};

function isRestaurantResponse(value: unknown): value is RestaurantResponse {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    isRestaurantState((value as Partial<RestaurantResponse>).data)
  );
}

async function readRestaurantResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`Restaurant request failed with status ${response.status}`);
  }

  const body = (await response.json().catch(() => null)) as unknown;

  if (!isRestaurantResponse(body)) {
    throw new Error("Restaurant response has an invalid shape");
  }

  return body.data;
}

export function createHttpRestaurantRepository(
  fetcher: Fetcher = fetch,
): RestaurantRepository {
  return {
    async loadRestaurant() {
      return readRestaurantResponse(
        await fetcher("/api/restaurant", { cache: "no-store" }),
      );
    },
    async saveRestaurant(state: RestaurantState) {
      await readRestaurantResponse(
        await fetcher("/api/restaurant", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(state),
        }),
      );
    },
    async resetDemo() {
      return readRestaurantResponse(
        await fetcher("/api/restaurant/reset", { method: "POST" }),
      );
    },
  };
}
