import { useCallback, useState } from "react";

import type { TablePosition } from "@/features/restaurant-state/model/actions";

type SaveTablePosition = (
  tableId: string,
  position: TablePosition,
) => Promise<boolean>;

export function usePendingTablePositions(
  saveTablePosition: SaveTablePosition,
) {
  const [positions, setPositions] = useState<Record<string, TablePosition>>({});
  const [isSaving, setIsSaving] = useState(false);

  const stagePosition = useCallback(
    (tableId: string, position: TablePosition) => {
      setPositions((currentPositions) => ({
        ...currentPositions,
        [tableId]: position,
      }));
    },
    [],
  );

  const discardPosition = useCallback((tableId: string) => {
    setPositions((currentPositions) => {
      if (!(tableId in currentPositions)) return currentPositions;

      const nextPositions = { ...currentPositions };
      delete nextPositions[tableId];
      return nextPositions;
    });
  }, []);

  const savePositions = useCallback(async () => {
    const pendingPositions = Object.entries(positions);

    if (pendingPositions.length === 0) return true;

    setIsSaving(true);

    try {
      const results = await Promise.all(
        pendingPositions.map(([tableId, position]) =>
          saveTablePosition(tableId, position),
        ),
      );

      if (results.some((isSaved) => !isSaved)) return false;

      setPositions({});
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [positions, saveTablePosition]);

  return {
    positions,
    isSaving,
    stagePosition,
    discardPosition,
    savePositions,
  };
}
