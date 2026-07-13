import { useCallback, useState } from "react";

import type { DiningTable } from "@/features/floor-plan/model/types";
import type { TablePosition } from "@/features/restaurant-state/model/actions";
import type { TablePatchInput } from "@/features/restaurant-state/model/schemas";

type SaveTablePatch = (
  tableId: string,
  patch: TablePatchInput,
) => Promise<boolean>;

export function mergeTablePatches(
  currentPatch: TablePatchInput | undefined,
  nextPatch: TablePatchInput,
): TablePatchInput {
  const layout =
    currentPatch?.layout || nextPatch.layout
      ? { ...currentPatch?.layout, ...nextPatch.layout }
      : undefined;

  return {
    ...currentPatch,
    ...nextPatch,
    ...(layout ? { layout } : {}),
  };
}

export function applyTablePatch(
  table: DiningTable,
  patch: TablePatchInput | undefined,
): DiningTable {
  if (!patch) return table;

  return {
    ...table,
    ...patch,
    layout: {
      ...table.layout,
      ...patch.layout,
    },
  };
}

export function usePendingTableChanges(saveTablePatch: SaveTablePatch) {
  const [patches, setPatches] = useState<Record<string, TablePatchInput>>({});
  const [isSaving, setIsSaving] = useState(false);

  const stagePatch = useCallback(
    (tableId: string, patch: TablePatchInput) => {
      setPatches((currentPatches) => ({
        ...currentPatches,
        [tableId]: mergeTablePatches(currentPatches[tableId], patch),
      }));
    },
    [],
  );

  const stagePosition = useCallback(
    (tableId: string, position: TablePosition) => {
      stagePatch(tableId, { layout: position });
    },
    [stagePatch],
  );

  const discardTable = useCallback((tableId: string) => {
    setPatches((currentPatches) => {
      if (!(tableId in currentPatches)) return currentPatches;

      const nextPatches = { ...currentPatches };
      delete nextPatches[tableId];
      return nextPatches;
    });
  }, []);

  const discardAll = useCallback(() => {
    setPatches({});
  }, []);

  const saveChanges = useCallback(async () => {
    const pendingPatches = Object.entries(patches);

    if (pendingPatches.length === 0) return true;

    setIsSaving(true);

    try {
      const results = await Promise.all(
        pendingPatches.map(([tableId, patch]) =>
          saveTablePatch(tableId, patch),
        ),
      );

      if (results.some((isSaved) => !isSaved)) return false;

      setPatches({});
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [patches, saveTablePatch]);

  return {
    patches,
    isSaving,
    stagePatch,
    stagePosition,
    discardTable,
    discardAll,
    saveChanges,
  };
}
