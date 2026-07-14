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

  cameraRef.current = camera;

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextViewport = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      setViewport((currentViewport) =>
        getStableViewport(currentViewport, nextViewport),
      );
    });

    resizeObserver.observe(svg);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
  }) => {
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect) return null;

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

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
    const cursor = getPointerPosition(event);

    if (!cursor) return;

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

    const pointer = getPointerPosition(event);

    if (!pointer) return;

    event.preventDefault();
    panUpdates.cancel();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      pointer,
      camera: cameraRef.current,
      captureTarget: event.currentTarget,
    };
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current;

    if (!pan || pan.pointerId !== event.pointerId) return;

    const pointer = getPointerPosition(event);

    if (!pointer) return;

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
