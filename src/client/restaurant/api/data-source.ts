export type DataSource = "local-storage" | "mock-api";

export const DATA_SOURCE_STORAGE_KEY = "qolay.data-source.v1";
export const DEFAULT_DATA_SOURCE: DataSource = "local-storage";

function isDataSource(value: string | null): value is DataSource {
  return value === "local-storage" || value === "mock-api";
}

export function readStoredDataSource(): DataSource {
  if (typeof window === "undefined") return DEFAULT_DATA_SOURCE;

  try {
    const stored = window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY);

    return isDataSource(stored) ? stored : DEFAULT_DATA_SOURCE;
  } catch {
    return DEFAULT_DATA_SOURCE;
  }
}

export function persistDataSource(source: DataSource) {
  try {
    window.localStorage.setItem(DATA_SOURCE_STORAGE_KEY, source);
  } catch {
    // Best-effort: without localStorage the app falls back to the default.
  }
}
