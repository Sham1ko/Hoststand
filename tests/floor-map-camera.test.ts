import {
  getStableViewport,
  shouldFitInitialViewport,
} from "@/components/floor-map/model/camera-viewport";

test("does not refit the camera after a temporary hidden viewport measurement", () => {
  const visibleViewport = { width: 800, height: 600 };
  const hiddenViewport = { width: 0, height: 0 };

  const viewportWhileHidden = getStableViewport(
    visibleViewport,
    hiddenViewport,
  );
  const viewportAfterReturn = getStableViewport(
    viewportWhileHidden,
    visibleViewport,
  );

  expect(viewportWhileHidden).toBe(visibleViewport);
  expect(viewportAfterReturn).toBe(visibleViewport);
  expect(shouldFitInitialViewport(true, viewportAfterReturn)).toBe(false);
});

test("fits the camera for the first valid viewport only", () => {
  const initialViewport = { width: 0, height: 0 };
  const measuredViewport = { width: 800, height: 600 };

  expect(shouldFitInitialViewport(false, initialViewport)).toBe(false);
  expect(shouldFitInitialViewport(false, measuredViewport)).toBe(true);
  expect(shouldFitInitialViewport(true, measuredViewport)).toBe(false);
});
