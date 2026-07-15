import {
  DEFAULT_DATA_SOURCE,
  resolveDataSource,
} from "@/client/restaurant/api/data-source";

describe("resolveDataSource", () => {
  it("allows the Mock API only when the feature flag is enabled", () => {
    expect(resolveDataSource("mock-api", true)).toBe("mock-api");
    expect(resolveDataSource("mock-api", false)).toBe(DEFAULT_DATA_SOURCE);
  });

  it("always allows localStorage and rejects unknown values", () => {
    expect(resolveDataSource("local-storage", false)).toBe("local-storage");
    expect(resolveDataSource("unknown", true)).toBe(DEFAULT_DATA_SOURCE);
    expect(resolveDataSource(null, true)).toBe(DEFAULT_DATA_SOURCE);
  });
});
