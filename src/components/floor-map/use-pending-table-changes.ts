import { useCallback, useState } from "react";

import type { DiningTable } from "@/features/floor-plan/model/types";
import type {
  CreateTableInput,
  TablePatchInput,
} from "@/features/floor-plan/model/schemas";
import type { TablePosition } from "@/features/restaurant/model/table-actions";

type SaveTablePatch = (
  tableId: string,
  patch: TablePatchInput,
) => Promise<boolean>;
type DeleteTable = (tableId: string) => Promise<boolean>;
type CreateTable = (
  input: CreateTableInput,
) => Promise<DiningTable | null>;

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

export function createDraftTable(
  input: CreateTableInput,
  id: string,
): DiningTable {
  return { ...input, id };
}

function getCreateTableInput(table: DiningTable): CreateTableInput {
  return {
    number: table.number,
    capacity: table.capacity,
    floorId: table.floorId,
    status: table.status,
    layout: table.layout,
  };
}

export function getDraftTables(
  tables: readonly DiningTable[],
  createdTables: readonly DiningTable[],
  patches: Readonly<Record<string, TablePatchInput>>,
  deletedTableIds: ReadonlySet<string>,
) {
  return [...tables, ...createdTables]
    .filter((table) => !deletedTableIds.has(table.id))
    .map((table) => applyTablePatch(table, patches[table.id]));
}

export function usePendingTableChanges(
  saveTablePatch: SaveTablePatch,
  deleteTable: DeleteTable,
  createTable: CreateTable,
) {
  const [patches, setPatches] = useState<Record<string, TablePatchInput>>({});
  const [createdTables, setCreatedTables] = useState<
    Record<string, DiningTable>
  >({});
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

  const stageCreation = useCallback((input: CreateTableInput) => {
    const table = createDraftTable(input, `draft-${crypto.randomUUID()}`);

    setCreatedTables((currentTables) => ({
      ...currentTables,
      [table.id]: table,
    }));

    return table;
  }, []);

  const stageDeletion = useCallback((tableId: string) => {
    setPatches((currentPatches) => {
      if (!(tableId in currentPatches)) return currentPatches;

      const nextPatches = { ...currentPatches };
      delete nextPatches[tableId];
      return nextPatches;
    });

    if (createdTables[tableId]) {
      setCreatedTables((currentTables) => {
        const nextTables = { ...currentTables };
        delete nextTables[tableId];
        return nextTables;
      });
      return;
    }

    setDeletedTableIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(tableId);
      return nextIds;
    });
  }, [createdTables]);

  const discardAll = useCallback(() => {
    setPatches({});
    setCreatedTables({});
    setDeletedTableIds(new Set());
  }, []);

  const saveChanges = useCallback(async () => {
    const pendingPatches = Object.entries(patches).filter(
      ([tableId]) => !createdTables[tableId],
    );
    const pendingCreations = Object.values(createdTables).map((table) =>
      applyTablePatch(table, patches[table.id]),
    );
    const pendingDeletions = Array.from(deletedTableIds);

    if (
      pendingPatches.length === 0 &&
      pendingCreations.length === 0 &&
      pendingDeletions.length === 0
    ) {
      return true;
    }

    setIsSaving(true);

    try {
      const deletionResults = await Promise.all(
        pendingDeletions.map(async (tableId) => ({
          tableId,
          isSaved: await deleteTable(tableId),
        })),
      );
      const deletedIds = new Set(
        deletionResults
          .filter((result) => result.isSaved)
          .map((result) => result.tableId),
      );

      if (deletedIds.size > 0) {
        setDeletedTableIds((currentIds) => {
          const nextIds = new Set(currentIds);
          deletedIds.forEach((tableId) => nextIds.delete(tableId));
          return nextIds;
        });
      }

      if (deletionResults.some((result) => !result.isSaved)) return false;

      const [patchResults, creationResults] = await Promise.all([
        Promise.all(
          pendingPatches.map(async ([tableId, patch]) => ({
            tableId,
            isSaved: await saveTablePatch(tableId, patch),
          })),
        ),
        Promise.all(
          pendingCreations.map(async (table) => ({
            tableId: table.id,
            isSaved: Boolean(await createTable(getCreateTableInput(table))),
          })),
        ),
      ]);
      const savedPatchIds = new Set(
        patchResults
          .filter((result) => result.isSaved)
          .map((result) => result.tableId),
      );
      const createdIds = new Set(
        creationResults
          .filter((result) => result.isSaved)
          .map((result) => result.tableId),
      );

      if (savedPatchIds.size > 0 || createdIds.size > 0) {
        setPatches((currentPatches) => {
          const nextPatches = { ...currentPatches };
          savedPatchIds.forEach((tableId) => delete nextPatches[tableId]);
          createdIds.forEach((tableId) => delete nextPatches[tableId]);
          return nextPatches;
        });
      }

      if (createdIds.size > 0) {
        setCreatedTables((currentTables) => {
          const nextTables = { ...currentTables };
          createdIds.forEach((tableId) => delete nextTables[tableId]);
          return nextTables;
        });
      }

      if (
        patchResults.some((result) => !result.isSaved) ||
        creationResults.some((result) => !result.isSaved)
      ) {
        return false;
      }

      setPatches({});
      setCreatedTables({});
      setDeletedTableIds(new Set());
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [
    createTable,
    createdTables,
    deleteTable,
    deletedTableIds,
    patches,
    saveTablePatch,
  ]);

  return {
    patches,
    createdTables,
    deletedTableIds,
    isSaving,
    stagePatch,
    stagePosition,
    stageCreation,
    stageDeletion,
    discardAll,
    saveChanges,
  };
}
