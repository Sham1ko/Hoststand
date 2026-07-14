import type { Size } from "@/lib/floor-plan/geometry";

export function getStableViewport(
  currentViewport: Size,
  measuredViewport: Size,
) {
  if (measuredViewport.width <= 0 || measuredViewport.height <= 0) {
    return currentViewport;
  }

  return currentViewport.width === measuredViewport.width &&
    currentViewport.height === measuredViewport.height
    ? currentViewport
    : measuredViewport;
}

export function shouldFitInitialViewport(
  hasFittedViewport: boolean,
  viewport: Size,
) {
  return (
    !hasFittedViewport && viewport.width > 0 && viewport.height > 0
  );
}
