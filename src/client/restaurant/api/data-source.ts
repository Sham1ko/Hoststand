export type DataSource = "local-storage" | "mock-api";

export const DATA_SOURCE_STORAGE_KEY = "qolay.data-source.v1";
export const DEFAULT_DATA_SOURCE: DataSource = "local-storage";
export const MOCK_API_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_MOCK_API === "true";

function isDataSource(value: string | null): value is DataSource {
  return value === "local-storage" || value === "mock-api";
}

export function resolveDataSource(
  value: string | null,
  mockApiEnabled = MOCK_API_ENABLED,
): DataSource {
  if (!isDataSource(value)) return DEFAULT_DATA_SOURCE;
  if (value === "mock-api" && !mockApiEnabled) return DEFAULT_DATA_SOURCE;

  return value;
}

export function readStoredDataSource(): DataSource {
  if (typeof window === "undefined") return DEFAULT_DATA_SOURCE;

  try {
    const stored = window.localStorage.getItem(DATA_SOURCE_STORAGE_KEY);

    return resolveDataSource(stored);
  } catch {
    return DEFAULT_DATA_SOURCE;
  }
}

export function persistDataSource(source: DataSource) {
  try {
    window.localStorage.setItem(
      DATA_SOURCE_STORAGE_KEY,
      resolveDataSource(source),
    );
  } catch {
    // Best-effort: without localStorage the app falls back to the default.
  }
}
