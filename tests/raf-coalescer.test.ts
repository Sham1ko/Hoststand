import { createRafCoalescer } from "@/components/floor-map/model/raf-coalescer";

function createHarness<T>() {
  let nextFrameId = 1;
  const callbacks = new Map<number, FrameRequestCallback>();
  const applied: T[] = [];
  const cancelled: number[] = [];
  const requestFrame = jest.fn((callback: FrameRequestCallback) => {
    const frameId = nextFrameId++;
    callbacks.set(frameId, callback);
    return frameId;
  });
  const cancelFrame = jest.fn((frameId: number) => {
    cancelled.push(frameId);
    callbacks.delete(frameId);
  });
  const coalescer = createRafCoalescer<T>({
    apply: (value) => applied.push(value),
    requestFrame,
    cancelFrame,
  });

  return {
    applied,
    callbacks,
    cancelled,
    coalescer,
    requestFrame,
  };
}

test("applies only the latest value from a burst in one frame", () => {
  const harness = createHarness<string>();

  harness.coalescer.schedule("first");
  harness.coalescer.schedule("second");
  harness.coalescer.schedule("latest");

  expect(harness.requestFrame).toHaveBeenCalledTimes(1);
  expect(harness.applied).toEqual([]);

  harness.callbacks.get(1)?.(16);

  expect(harness.applied).toEqual(["latest"]);
});

test("flushes the latest pending value before pointerup commit", () => {
  const harness = createHarness<{ x: number; y: number }>();

  harness.coalescer.schedule({ x: 20, y: 30 });
  harness.coalescer.schedule({ x: 40, y: 50 });
  harness.coalescer.flush();

  expect(harness.cancelled).toEqual([1]);
  expect(harness.applied).toEqual([{ x: 40, y: 50 }]);
  expect(harness.coalescer.hasPending()).toBe(false);
});

test("flushes pending movement before a later synchronous action", () => {
  const harness = createHarness<string>();

  harness.coalescer.schedule("latest pan");
  harness.coalescer.flush();
  harness.applied.push("zoom");

  expect(harness.applied).toEqual(["latest pan", "zoom"]);
});

test("cancel discards pending work and permits a later gesture", () => {
  const harness = createHarness<string>();

  harness.coalescer.schedule("discarded");
  harness.coalescer.cancel();

  expect(harness.cancelled).toEqual([1]);
  expect(harness.applied).toEqual([]);
  expect(harness.coalescer.hasPending()).toBe(false);

  harness.coalescer.schedule("next gesture");
  harness.callbacks.get(2)?.(32);

  expect(harness.applied).toEqual(["next gesture"]);
});
