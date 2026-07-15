import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";

import {
  fitCameraToViewport,
  getPannedCamera,
  zoomCameraAtPoint,
  type Camera,
  type Point,
  type Size,
} from "@/lib/floor-plan/geometry";

import {
  getStableViewport,
  shouldFitInitialViewport,
} from "../model/camera-viewport";
import {
  createElementBoundingRectCache,
  getLocalPointerPosition,
  type FloorMapRect,
} from "../model/bounding-rect-cache";
import { useRafCoalescer } from "./use-raf-coalescer";

const initialCamera: Camera = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

type PanState = {
  pointerId: number;
  pointer: Point;
  camera: Camera;
  captureTarget: SVGSVGElement;
  svgRect: FloorMapRect;
};

function isSameCamera(first: Camera, second: Camera) {
  return (
    first.scale === second.scale &&
    first.offsetX === second.offsetX &&
    first.offsetY === second.offsetY
  );
}

function releasePanCapture(pan: PanState) {
  if (pan.captureTarget.hasPointerCapture(pan.pointerId)) {
    pan.captureTarget.releasePointerCapture(pan.pointerId);
  }
}

export function useFloorMapCamera() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rectCache] = useState(createElementBoundingRectCache);
  const panRef = useRef<PanState | null>(null);
  const hasFittedViewportRef = useRef(false);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [camera, setCamera] = useState(initialCamera);
  const cameraRef = useRef(camera);
  const panUpdates = useRafCoalescer<Camera>((nextCamera) => {
    if (isSameCamera(cameraRef.current, nextCamera)) return;

    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  });
  const rectRefreshes = useRafCoalescer<undefined>(() => {
    rectCache.refresh();
  });

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    rectCache.setElement(svg);
    rectCache.refresh();

    const resizeObserver = new ResizeObserver(([entry]) => {
      rectCache.refresh();

      const nextViewport = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      setViewport((currentViewport) =>
        getStableViewport(currentViewport, nextViewport),
      );
    });

    const scheduleRectRefresh = () => {
      rectRefreshes.schedule(undefined);
    };
    const visualViewport = window.visualViewport;

    resizeObserver.observe(svg);
    window.addEventListener("resize", scheduleRectRefresh);
    window.addEventListener("orientationchange", scheduleRectRefresh);
    window.addEventListener("scroll", scheduleRectRefresh, {
      capture: true,
      passive: true,
    });
    visualViewport?.addEventListener("resize", scheduleRectRefresh);
    visualViewport?.addEventListener("scroll", scheduleRectRefresh);

    return () => {
      rectRefreshes.cancel();
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleRectRefresh);
      window.removeEventListener("orientationchange", scheduleRectRefresh);
      window.removeEventListener("scroll", scheduleRectRefresh, true);
      visualViewport?.removeEventListener("resize", scheduleRectRefresh);
      visualViewport?.removeEventListener("scroll", scheduleRectRefresh);
      rectCache.setElement(null);
    };
  }, [rectCache, rectRefreshes]);

  useEffect(() => {
    if (!shouldFitInitialViewport(hasFittedViewportRef.current, viewport)) {
      return;
    }

    hasFittedViewportRef.current = true;
    const nextCamera = fitCameraToViewport(viewport);
    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  }, [viewport]);

  useEffect(
    () => () => {
      panUpdates.cancel();

      if (panRef.current) {
        releasePanCapture(panRef.current);
        panRef.current = null;
      }
    },
    [panUpdates],
  );

  const getPointerPosition = (event: {
    clientX: number;
    clientY: number;
  }, rect: FloorMapRect) => getLocalPointerPosition(event, rect);

  const fitCamera = () => {
    if (!viewport.width || !viewport.height) return;

    panUpdates.flush();
    const nextCamera = fitCameraToViewport(viewport);

    if (isSameCamera(cameraRef.current, nextCamera)) return;

    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  };

  const zoomAtViewportCenter = (factor: number) => {
    if (!viewport.width || !viewport.height) return;

    const cursor = {
      x: viewport.width / 2,
      y: viewport.height / 2,
    };

    panUpdates.flush();
    const currentCamera = cameraRef.current;
    const nextCamera = zoomCameraAtPoint(
      currentCamera,
      cursor,
      currentCamera.scale * factor,
    );

    if (nextCamera === currentCamera) return;

    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    const rect = rectCache.refresh();

    if (!rect) return;

    const cursor = getPointerPosition(event, rect);

    event.preventDefault();

    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

    panUpdates.flush();
    const currentCamera = cameraRef.current;
    const nextCamera = zoomCameraAtPoint(
      currentCamera,
      cursor,
      currentCamera.scale * factor,
    );

    if (nextCamera === currentCamera) return;

    cameraRef.current = nextCamera;
    setCamera(nextCamera);
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    if ((event.target as Element).closest("[data-table-node]")) return;

    const rect = rectCache.refresh();

    if (!rect) return;

    const pointer = getPointerPosition(event, rect);

    event.preventDefault();
    panUpdates.cancel();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      pointer,
      camera: cameraRef.current,
      captureTarget: event.currentTarget,
      svgRect: rect,
    };
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current;

    if (!pan || pan.pointerId !== event.pointerId) return;

    const pointer = getPointerPosition(event, pan.svgRect);

    const nextCamera = getPannedCamera(pan.camera, pan.pointer, pointer);

    if (
      isSameCamera(cameraRef.current, nextCamera) &&
      !panUpdates.hasPending()
    ) {
      return;
    }

    panUpdates.schedule(nextCamera);
  };

  const finishPan = (event: PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current;

    if (!pan || pan.pointerId !== event.pointerId) return;

    if (event.type === "pointercancel") {
      panUpdates.cancel();
    } else {
      panUpdates.flush();
    }

    releasePanCapture(pan);
    panRef.current = null;
  };

  return {
    svgRef,
    rectCache,
    viewport,
    camera,
    fitCamera,
    zoomAtViewportCenter,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    finishPan,
  };
}
