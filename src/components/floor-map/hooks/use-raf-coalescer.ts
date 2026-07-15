import { useEffect, useState } from "react";

import {
  createRafCoalescer,
} from "../model/raf-coalescer";

function createRafCoalescerController<T>(initialApply: (value: T) => void) {
  let apply = initialApply;
  const coalescer = createRafCoalescer<T>({
    apply: (value) => apply(value),
    requestFrame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (frameId) => cancelAnimationFrame(frameId),
  });

  return {
    coalescer,
    setApply(nextApply: (value: T) => void) {
      apply = nextApply;
    },
  };
}

export function useRafCoalescer<T>(apply: (value: T) => void) {
  const [controller] = useState(() => createRafCoalescerController(apply));
  const { coalescer } = controller;

  useEffect(() => {
    controller.setApply(apply);
  }, [apply, controller]);

  useEffect(() => () => coalescer.cancel(), [coalescer]);

  return coalescer;
}
