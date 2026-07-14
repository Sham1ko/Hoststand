import { useEffect, useRef } from "react";

import {
  createRafCoalescer,
  type RafCoalescer,
} from "../model/raf-coalescer";

export function useRafCoalescer<T>(apply: (value: T) => void) {
  const applyRef = useRef(apply);
  const coalescerRef = useRef<RafCoalescer<T> | null>(null);

  applyRef.current = apply;

  if (!coalescerRef.current) {
    coalescerRef.current = createRafCoalescer<T>({
      apply: (value) => applyRef.current(value),
      requestFrame: (callback) => requestAnimationFrame(callback),
      cancelFrame: (frameId) => cancelAnimationFrame(frameId),
    });
  }

  const coalescer = coalescerRef.current;

  useEffect(() => () => coalescer.cancel(), [coalescer]);

  return coalescer;
}
