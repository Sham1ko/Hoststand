import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";

import {
  fitCameraToViewport,
  zoomCameraAtPoint,
  type Camera,
  type Point,
  type Size,
} from "@/features/floor-plan/model/geometry";

const initialCamera: Camera = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

type PanState = {
  pointerId: number;
  pointer: Point;
  camera: Camera;
};

export function useFloorMapCamera() {
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<PanState | null>(null);
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [camera, setCamera] = useState(initialCamera);

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      const nextViewport = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      };

      setViewport((currentViewport) =>
        currentViewport.width === nextViewport.width &&
        currentViewport.height === nextViewport.height
          ? currentViewport
          : nextViewport,
      );
    });

    resizeObserver.observe(svg);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!viewport.width || !viewport.height) return;

    setCamera(fitCameraToViewport(viewport));
  }, [viewport]);

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

    setCamera(fitCameraToViewport(viewport));
  };

  const zoomAtViewportCenter = (factor: number) => {
    if (!viewport.width || !viewport.height) return;

    const cursor = {
      x: viewport.width / 2,
      y: viewport.height / 2,
    };

    setCamera((currentCamera) =>
      zoomCameraAtPoint(currentCamera, cursor, currentCamera.scale * factor),
    );
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    const cursor = getPointerPosition(event);

    if (!cursor) return;

    event.preventDefault();

    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

    setCamera((currentCamera) =>
      zoomCameraAtPoint(currentCamera, cursor, currentCamera.scale * factor),
    );
  };

  const handlePointerDown = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary || event.button !== 0) return;
    if ((event.target as Element).closest("[data-table-node]")) return;

    const pointer = getPointerPosition(event);

    if (!pointer) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panRef.current = {
      pointerId: event.pointerId,
      pointer,
      camera,
    };
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const pan = panRef.current;

    if (!pan || pan.pointerId !== event.pointerId) return;

    const pointer = getPointerPosition(event);

    if (!pointer) return;

    setCamera({
      ...pan.camera,
      offsetX: pan.camera.offsetX + pointer.x - pan.pointer.x,
      offsetY: pan.camera.offsetY + pointer.y - pan.pointer.y,
    });
  };

  const finishPan = (event: PointerEvent<SVGSVGElement>) => {
    if (panRef.current?.pointerId !== event.pointerId) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

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


