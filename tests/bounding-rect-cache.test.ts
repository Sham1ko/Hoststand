import {
  createBoundingRectCache,
  getLocalPointerPosition,
  type FloorMapRect,
} from "@/components/floor-map/model/bounding-rect-cache";

const firstRect: FloorMapRect = {
  left: 100,
  top: 50,
  width: 800,
  height: 600,
};

const resizedRect: FloorMapRect = {
  left: 80,
  top: 40,
  width: 1024,
  height: 768,
};

test("reads the cached rect without measuring layout again", () => {
  const measure = jest.fn(() => firstRect);
  const cache = createBoundingRectCache(measure);

  expect(cache.get()).toBeNull();
  expect(measure).not.toHaveBeenCalled();

  expect(cache.refresh()).toEqual(firstRect);
  expect(cache.get()).toEqual(firstRect);
  expect(cache.get()).toEqual(firstRect);
  expect(measure).toHaveBeenCalledTimes(1);
});

test("replaces the cached rect when layout is measured after resize", () => {
  const rects: Array<FloorMapRect | null> = [firstRect, resizedRect];
  const measure = jest.fn(() => rects.shift() ?? null);
  const cache = createBoundingRectCache(measure);

  expect(cache.refresh()).toEqual(firstRect);
  expect(cache.refresh()).toEqual(resizedRect);
  expect(cache.get()).toEqual(resizedRect);

  cache.clear();
  expect(cache.get()).toBeNull();
});

test("stores a numeric snapshot instead of a mutable measured object", () => {
  const measuredRect = { ...firstRect };
  const cache = createBoundingRectCache(() => measuredRect);

  cache.refresh();
  measuredRect.left = 999;

  expect(cache.get()).toEqual(firstRect);
});

test("converts client coordinates using the cached SVG origin", () => {
  expect(
    getLocalPointerPosition({ clientX: 340, clientY: 230 }, firstRect),
  ).toEqual({ x: 240, y: 180 });
});
