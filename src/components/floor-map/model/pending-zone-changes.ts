import { useCallback, useState } from "react";

import type {
  CreateZoneInput,
  ZonePatchInput,
} from "@/entities/zone/model/schemas";
import type { TableZone } from "@/entities/zone/model/types";

type SaveZonePatch = (
  zoneId: string,
  patch: ZonePatchInput,
) => Promise<boolean>;
type DeleteZone = (zoneId: string) => Promise<boolean>;
type CreateZone = (input: CreateZoneInput) => Promise<TableZone | null>;

export function mergeZonePatches(
  currentPatch: ZonePatchInput | undefined,
  nextPatch: ZonePatchInput,
): ZonePatchInput {
  return { ...currentPatch, ...nextPatch };
}

export function applyZonePatch(
  zone: TableZone,
  patch: ZonePatchInput | undefined,
): TableZone {
  if (!patch) return zone;

  return { ...zone, ...patch };
}

export function createDraftZone(
  input: CreateZoneInput,
  id: string,
): TableZone {
  return { ...input, id };
}

function getCreateZoneInput(zone: TableZone): CreateZoneInput | null {
  if (!zone.rect) return null;

  return {
    floorId: zone.floorId,
    name: zone.name,
    color: zone.color,
    sortOrder: zone.sortOrder,
    isActive: zone.isActive,
    rect: zone.rect,
  };
}

export function getDraftZones(
  zones: readonly TableZone[],
  createdZones: readonly TableZone[],
  patches: Readonly<Record<string, ZonePatchInput>>,
  deletedZoneIds: ReadonlySet<string>,
) {
  return [...zones, ...createdZones]
    .filter((zone) => !deletedZoneIds.has(zone.id))
    .map((zone) => applyZonePatch(zone, patches[zone.id]));
}

export function usePendingZoneChanges(
  saveZonePatch: SaveZonePatch,
  deleteZone: DeleteZone,
  createZone: CreateZone,
) {
  const [patches, setPatches] = useState<Record<string, ZonePatchInput>>({});
  const [createdZones, setCreatedZones] = useState<Record<string, TableZone>>(
    {},
  );
  const [deletedZoneIds, setDeletedZoneIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const stagePatch = useCallback(
    (zoneId: string, patch: ZonePatchInput) => {
      setPatches((currentPatches) => ({
        ...currentPatches,
        [zoneId]: mergeZonePatches(currentPatches[zoneId], patch),
      }));
    },
    [],
  );

  const stageRect = useCallback(
    (zoneId: string, rect: NonNullable<TableZone["rect"]>) => {
      stagePatch(zoneId, { rect });
    },
    [stagePatch],
  );

  const stageCreation = useCallback((input: CreateZoneInput) => {
    const zone = createDraftZone(input, `draft-${crypto.randomUUID()}`);

    setCreatedZones((currentZones) => ({
      ...currentZones,
      [zone.id]: zone,
    }));

    return zone;
  }, []);

  const stageDeletion = useCallback((zoneId: string) => {
    setPatches((currentPatches) => {
      if (!(zoneId in currentPatches)) return currentPatches;

      const nextPatches = { ...currentPatches };
      delete nextPatches[zoneId];
      return nextPatches;
    });

    if (createdZones[zoneId]) {
      setCreatedZones((currentZones) => {
        const nextZones = { ...currentZones };
        delete nextZones[zoneId];
        return nextZones;
      });
      return;
    }

    setDeletedZoneIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.add(zoneId);
      return nextIds;
    });
  }, [createdZones]);

  const discardAll = useCallback(() => {
    setPatches({});
    setCreatedZones({});
    setDeletedZoneIds(new Set());
  }, []);

  const saveChanges = useCallback(async () => {
    const pendingPatches = Object.entries(patches).filter(
      ([zoneId]) => !createdZones[zoneId],
    );
    const pendingCreations = Object.values(createdZones).map((zone) =>
      applyZonePatch(zone, patches[zone.id]),
    );
    const pendingDeletions = Array.from(deletedZoneIds);

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
        pendingDeletions.map(async (zoneId) => ({
          zoneId,
          isSaved: await deleteZone(zoneId),
        })),
      );
      const deletedIds = new Set(
        deletionResults
          .filter((result) => result.isSaved)
          .map((result) => result.zoneId),
      );

      if (deletedIds.size > 0) {
        setDeletedZoneIds((currentIds) => {
          const nextIds = new Set(currentIds);
          deletedIds.forEach((zoneId) => nextIds.delete(zoneId));
          return nextIds;
        });
      }

      if (deletionResults.some((result) => !result.isSaved)) return false;

      const [patchResults, creationResults] = await Promise.all([
        Promise.all(
          pendingPatches.map(async ([zoneId, patch]) => ({
            zoneId,
            isSaved: await saveZonePatch(zoneId, patch),
          })),
        ),
        Promise.all(
          pendingCreations.map(async (zone) => {
            const input = getCreateZoneInput(zone);

            return {
              zoneId: zone.id,
              isSaved: input ? Boolean(await createZone(input)) : false,
            };
          }),
        ),
      ]);
      const savedPatchIds = new Set(
        patchResults
          .filter((result) => result.isSaved)
          .map((result) => result.zoneId),
      );
      const createdIds = new Set(
        creationResults
          .filter((result) => result.isSaved)
          .map((result) => result.zoneId),
      );

      if (savedPatchIds.size > 0 || createdIds.size > 0) {
        setPatches((currentPatches) => {
          const nextPatches = { ...currentPatches };
          savedPatchIds.forEach((zoneId) => delete nextPatches[zoneId]);
          createdIds.forEach((zoneId) => delete nextPatches[zoneId]);
          return nextPatches;
        });
      }

      if (createdIds.size > 0) {
        setCreatedZones((currentZones) => {
          const nextZones = { ...currentZones };
          createdIds.forEach((zoneId) => delete nextZones[zoneId]);
          return nextZones;
        });
      }

      if (
        patchResults.some((result) => !result.isSaved) ||
        creationResults.some((result) => !result.isSaved)
      ) {
        return false;
      }

      setPatches({});
      setCreatedZones({});
      setDeletedZoneIds(new Set());
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [
    createZone,
    createdZones,
    deleteZone,
    deletedZoneIds,
    patches,
    saveZonePatch,
  ]);

  return {
    patches,
    createdZones,
    deletedZoneIds,
    isSaving,
    stagePatch,
    stageRect,
    stageCreation,
    stageDeletion,
    discardAll,
    saveChanges,
  };
}
