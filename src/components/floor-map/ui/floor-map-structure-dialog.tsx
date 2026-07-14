"use client";

import { Layers3, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { FloorStructureInput } from "@/entities/restaurant/model/schemas";
import type { TableFloor } from "@/entities/floor/model/types";
import type { DiningTable } from "@/entities/table/model/types";
import type { TableZone } from "@/entities/zone/model/types";

const zoneColors = ["#f97346", "#4ba3df", "#7c55e8", "#f0a52f", "#4fb487"];

const inputClassName =
  "h-9 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200";

type FloorMapStructureDialogProps = {
  floors: readonly TableFloor[];
  zones: readonly TableZone[];
  tables: readonly DiningTable[];
  activeFloorId: string;
  onSave: (input: FloorStructureInput) => Promise<boolean>;
  onSaved: () => void;
};

export function FloorMapStructureDialog({
  floors,
  zones,
  tables,
  activeFloorId,
  onSave,
  onSaved,
}: FloorMapStructureDialogProps) {
  const [open, setOpen] = useState(false);
  const [draftFloors, setDraftFloors] = useState<TableFloor[]>([]);
  const [draftZones, setDraftZones] = useState<TableZone[]>([]);
  const [selectedFloorId, setSelectedFloorId] = useState(activeFloorId);
  const [draftActiveFloorId, setDraftActiveFloorId] = useState(activeFloorId);
  const [newFloorName, setNewFloorName] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const [newZoneColor, setNewZoneColor] = useState(zoneColors[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const tableCounts = useMemo(() => {
    const counts = new Map<string, number>();

    tables.forEach((table) => {
      counts.set(table.floorId, (counts.get(table.floorId) ?? 0) + 1);
    });

    return counts;
  }, [tables]);

  const selectedFloor = draftFloors.find(
    (floor) => floor.id === selectedFloorId,
  );
  const selectedZones = draftZones
    .filter((zone) => zone.floorId === selectedFloorId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const hasInvalidNames =
    draftFloors.some((floor) => floor.name.trim().length === 0) ||
    draftZones.some((zone) => zone.name.trim().length === 0);

  const resetDraft = () => {
    const initialFloorId = floors.some((floor) => floor.id === activeFloorId)
      ? activeFloorId
      : floors[0]?.id;

    setDraftFloors(floors.map((floor) => ({ ...floor })));
    setDraftZones(zones.map((zone) => ({ ...zone })));
    setSelectedFloorId(initialFloorId ?? "");
    setDraftActiveFloorId(initialFloorId ?? "");
    setNewFloorName("");
    setNewZoneName("");
    setNewZoneColor(zoneColors[0]);
    setSaveError(undefined);
  };

  const addFloor = () => {
    const name = newFloorName.trim();

    if (!name) return;

    const floor: TableFloor = {
      id: crypto.randomUUID(),
      name,
      sortOrder: Math.max(0, ...draftFloors.map((item) => item.sortOrder)) + 1,
      isActive: true,
    };

    setDraftFloors((currentFloors) => [...currentFloors, floor]);
    setSelectedFloorId(floor.id);
    setNewFloorName("");
  };

  const deleteFloor = (floorId: string) => {
    if ((tableCounts.get(floorId) ?? 0) > 0 || draftFloors.length <= 1) return;

    const remainingFloors = draftFloors.filter((floor) => floor.id !== floorId);
    const fallbackFloorId = remainingFloors[0]?.id ?? "";

    setDraftFloors(remainingFloors);
    setDraftZones((currentZones) =>
      currentZones.filter((zone) => zone.floorId !== floorId),
    );

    if (selectedFloorId === floorId) setSelectedFloorId(fallbackFloorId);
    if (draftActiveFloorId === floorId) {
      setDraftActiveFloorId(fallbackFloorId);
    }
  };

  const addZone = () => {
    const name = newZoneName.trim();

    if (!name || !selectedFloor) return;

    const offset = (selectedZones.length % 4) * 40;
    const zone: TableZone = {
      id: crypto.randomUUID(),
      floorId: selectedFloor.id,
      name,
      color: newZoneColor,
      sortOrder: Math.max(0, ...selectedZones.map((item) => item.sortOrder)) + 1,
      isActive: true,
      rect: {
        x: 560 + offset,
        y: 320 + offset,
        w: 400,
        h: 260,
      },
    };

    setDraftZones((currentZones) => [...currentZones, zone]);
    setNewZoneName("");
  };

  const saveStructure = async () => {
    if (hasInvalidNames || draftFloors.length === 0) return;

    setIsSaving(true);
    setSaveError(undefined);

    const isSaved = await onSave({
      floors: draftFloors,
      zones: draftZones,
      activeFloorId: draftActiveFloorId,
    });

    setIsSaving(false);

    if (!isSaved) {
      setSaveError(
        "Не удалось сохранить. Этаж со столами нельзя удалить.",
      );
      return;
    }

    onSaved();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) resetDraft();
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button type="button" variant="ghost" size="lg" title="Этажи и зоны" />
        }
      >
        <Layers3 aria-hidden="true" data-icon="inline-start" />
        <span className="@max-[58rem]/floor-map:sr-only">Этажи и зоны</span>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100vh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-lg **:data-[slot=dialog-close]:top-4 **:data-[slot=dialog-close]:right-4">
        <DialogHeader className="border-b border-slate-100 px-6 py-5">
          <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
            Этажи и зоны
          </DialogTitle>
          <DialogDescription className="sr-only">
            Добавление, переименование и удаление этажей и зон ресторана
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-5">
          <section aria-labelledby="floors-heading">
            <h3 id="floors-heading" className="mb-2 text-xs font-semibold text-slate-500">
              Этажи
            </h3>

            <div className="space-y-2">
              {draftFloors
                .toSorted((left, right) => left.sortOrder - right.sortOrder)
                .map((floor) => {
                  const tableCount = tableCounts.get(floor.id) ?? 0;
                  const canDelete = draftFloors.length > 1 && tableCount === 0;

                  return (
                    <div
                      key={floor.id}
                      className={`grid grid-cols-[minmax(0,1fr)_4.5rem_2rem] items-center gap-2 rounded-lg transition ${
                        selectedFloorId === floor.id
                          ? "bg-slate-50 ring-1 ring-slate-200"
                          : ""
                      }`}
                    >
                      <input
                        aria-label={`Название этажа ${floor.name}`}
                        value={floor.name}
                        className={`${inputClassName} border-transparent bg-transparent focus:bg-white`}
                        onFocus={() => setSelectedFloorId(floor.id)}
                        onChange={(event) => {
                          const name = event.target.value;
                          setDraftFloors((currentFloors) =>
                            currentFloors.map((item) =>
                              item.id === floor.id ? { ...item, name } : item,
                            ),
                          );
                        }}
                      />
                      <span className="text-right text-xs text-slate-400">
                        {tableCount} стол.
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        aria-label={`Удалить этаж ${floor.name}`}
                        title={
                          canDelete
                            ? "Удалить этаж"
                            : tableCount > 0
                              ? "Сначала удалите или перенесите столы"
                              : "Нельзя удалить последний этаж"
                        }
                        disabled={!canDelete}
                        className="text-slate-500 hover:text-red-600"
                        onClick={() => deleteFloor(floor.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  );
                })}
            </div>

            <div className="mt-2 grid grid-cols-[minmax(0,1fr)_2rem] items-center gap-2">
              <input
                aria-label="Название нового этажа"
                value={newFloorName}
                placeholder="Название нового этажа..."
                className={inputClassName}
                onChange={(event) => setNewFloorName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addFloor();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                aria-label="Добавить этаж"
                disabled={!newFloorName.trim()}
                onClick={addFloor}
              >
                <Plus aria-hidden="true" />
              </Button>
            </div>
          </section>

          <section aria-labelledby="zones-heading" className="mt-6">
            <h3 id="zones-heading" className="mb-2 text-xs font-semibold text-slate-500">
              Зоны — {selectedFloor?.name ?? "выберите этаж"}
            </h3>

            <div className="space-y-2">
              {selectedZones.map((zone) => (
                <div
                  key={zone.id}
                  className="grid grid-cols-[2.25rem_minmax(0,1fr)_2rem] items-center gap-2"
                >
                  <label
                    title="Изменить цвет зоны"
                    className="relative block size-9 cursor-pointer rounded-lg border-2 border-white ring-1 ring-slate-200 transition hover:scale-105 hover:ring-slate-300 focus-within:ring-2 focus-within:ring-slate-500"
                    style={{ backgroundColor: zone.color }}
                  >
                    <input
                      type="color"
                      aria-label={`Цвет зоны ${zone.name}`}
                      value={zone.color}
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={(event) => {
                        const color = event.target.value;
                        setDraftZones((currentZones) =>
                          currentZones.map((item) =>
                            item.id === zone.id ? { ...item, color } : item,
                          ),
                        );
                      }}
                    />
                  </label>
                  <input
                    aria-label={`Название зоны ${zone.name}`}
                    value={zone.name}
                    className={inputClassName}
                    onChange={(event) => {
                      const name = event.target.value;
                      setDraftZones((currentZones) =>
                        currentZones.map((item) =>
                          item.id === zone.id ? { ...item, name } : item,
                        ),
                      );
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-lg"
                    aria-label={`Удалить зону ${zone.name}`}
                    className="text-slate-500 hover:text-red-600"
                    onClick={() => {
                      setDraftZones((currentZones) =>
                        currentZones.filter((item) => item.id !== zone.id),
                      );
                    }}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>

            {selectedFloor && (
              <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)_2rem] items-center gap-2">
                <div className="flex gap-1" aria-label="Цвет новой зоны">
                  {zoneColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Выбрать цвет ${color}`}
                      aria-pressed={newZoneColor === color}
                      className="size-7 rounded-lg border-2 border-white ring-1 ring-slate-200 transition hover:scale-105 aria-pressed:ring-2 aria-pressed:ring-slate-800"
                      style={{ backgroundColor: color }}
                      onClick={() => setNewZoneColor(color)}
                    />
                  ))}
                </div>
                <input
                  aria-label="Название новой зоны"
                  value={newZoneName}
                  placeholder="Название новой зоны..."
                  className={inputClassName}
                  onChange={(event) => setNewZoneName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addZone();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-lg"
                  aria-label="Добавить зону"
                  disabled={!newZoneName.trim()}
                  onClick={addZone}
                >
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            )}
          </section>

          {saveError && (
            <p role="alert" className="mt-4 text-xs text-red-600">
              {saveError}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 p-5">
          <Button
            type="button"
            size="lg"
            className="w-full bg-slate-950 text-white hover:bg-slate-800"
            disabled={isSaving || hasInvalidNames || draftFloors.length === 0}
            onClick={() => void saveStructure()}
          >
            {isSaving ? "Сохранение..." : "Готово"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
