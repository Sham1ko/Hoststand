import { useCallback, useState } from "react";

import type { DiningTable } from "@/features/floor-plan/model/types";
import type { TablePosition } from "@/features/restaurant-state/model/actions";
import type { TablePatchInput } from "@/features/restaurant-state/model/schemas";

type SaveTablePatch = (
  tableId: string,
  patch: TablePatchInput,
) => Promise<boolean>;
type DeleteTable = (tableId: string) => Promise<boolean>;

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

export function getDraftTables(
  tables: readonly DiningTable[],
  patches: Readonly<Record<string, TablePatchInput>>,
  deletedTableIds: ReadonlySet<string>,
) {
  return tables
    .filter((table) => !deletedTableIds.has(table.id))
    .map((table) => applyTablePatch(table, patches[table.id]));
}

export function usePendingTableChanges(
  saveTablePatch: SaveTablePatch,
  deleteTable: DeleteTable,
) {
  const [patches, setPatches] = useState<Record<string, TablePatchInput>>({});
  const [deletedTableIds, setDeletedTableIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
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

  const stageDeletion = useCallback((tableId: string) => {
    setPatches((currentPatches) => {
      if (!(tableId in currentPatches)) return currentPatches;

      const nextPatches = { ...currentPatches };
      delete nextPatches[tableId];
      return nextPatches;
    });
    setDeletedTableIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(tableId);
      return nextIds;
    });
  }, []);

  const discardAll = useCallback(() => {
    setPatches({});
    setDeletedTableIds(new Set());
  }, []);

  const saveChanges = useCallback(async () => {
    const pendingPatches = Object.entries(patches);
    const pendingDeletions = Array.from(deletedTableIds);

    if (pendingPatches.length === 0 && pendingDeletions.length === 0) {
      return true;
    }

    setIsSaving(true);

    try {
      const results = await Promise.all([
        ...pendingPatches.map(([tableId, patch]) =>
          saveTablePatch(tableId, patch),
        ),
        ...pendingDeletions.map((tableId) => deleteTable(tableId)),
      ]);

      if (results.some((isSaved) => !isSaved)) return false;

      setPatches({});
      setDeletedTableIds(new Set());
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [deleteTable, deletedTableIds, patches, saveTablePatch]);

  return {
    patches,
    deletedTableIds,
    isSaving,
    stagePatch,
    stagePosition,
    stageDeletion,
    discardAll,
    saveChanges,
  };
}
