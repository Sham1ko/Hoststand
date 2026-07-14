type RafCoalescerOptions<T> = {
  apply: (value: T) => void;
  requestFrame: (callback: FrameRequestCallback) => number;
  cancelFrame: (frameId: number) => void;
};

export type RafCoalescer<T> = {
  schedule: (value: T) => void;
  flush: () => void;
  cancel: () => void;
  hasPending: () => boolean;
};

export function createRafCoalescer<T>({
  apply,
  requestFrame,
  cancelFrame,
}: RafCoalescerOptions<T>): RafCoalescer<T> {
  let frameId: number | null = null;
  let pendingValue: T;
  let hasPendingValue = false;

  const applyPending = () => {
    if (!hasPendingValue) return;

    const value = pendingValue;
    hasPendingValue = false;
    apply(value);
  };

  const cancelFrameIfScheduled = () => {
    if (frameId === null) return;

    cancelFrame(frameId);
    frameId = null;
  };

  const cancel = () => {
    cancelFrameIfScheduled();
    hasPendingValue = false;
  };

  return {
    schedule(value) {
      pendingValue = value;
      hasPendingValue = true;

      if (frameId !== null) return;

      frameId = requestFrame(() => {
        frameId = null;
        applyPending();
      });
    },
    flush() {
      cancelFrameIfScheduled();
      applyPending();
    },
    cancel,
    hasPending() {
      return hasPendingValue;
    },
  };
}
