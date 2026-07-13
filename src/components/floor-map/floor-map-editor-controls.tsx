import { Check, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export type FloorMapEditorTool = "tables" | "zones";

type FloorMapEditorControlsProps = {
  isEditing: boolean;
  tool: FloorMapEditorTool;
  onToggle: () => void;
  onCreateTable: () => void;
  onCreateZone: () => void;
  onToolChange: (tool: FloorMapEditorTool) => void;
};

export function FloorMapEditorControls({
  isEditing,
  tool,
  onToggle,
  onCreateTable,
  onCreateZone,
  onToolChange,
}: FloorMapEditorControlsProps) {
  return (
    <div className="flex items-center gap-1">
      {isEditing && (
        <>
          <div
            role="group"
            aria-label="Режим редактирования"
            className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5"
          >
            <Button
              type="button"
              variant={tool === "tables" ? "secondary" : "ghost"}
              size="xs"
              aria-pressed={tool === "tables"}
              onClick={() => onToolChange("tables")}
            >
              Столы
            </Button>
            <Button
              type="button"
              variant={tool === "zones" ? "secondary" : "ghost"}
              size="xs"
              aria-pressed={tool === "zones"}
              onClick={() => onToolChange("zones")}
            >
              Зоны
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title={tool === "tables" ? "Добавить стол" : "Добавить зону"}
            onClick={tool === "tables" ? onCreateTable : onCreateZone}
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
            {tool === "tables" ? "Стол" : "Зона"}
          </Button>
        </>
      )}
      <Button
        type="button"
        variant={isEditing ? "default" : "outline"}
        size="sm"
        aria-pressed={isEditing}
        title={isEditing ? "Завершить редактирование" : "Редактировать столы"}
        onClick={onToggle}
      >
        {isEditing ? (
          <Check aria-hidden="true" data-icon="inline-start" />
        ) : (
          <Pencil aria-hidden="true" data-icon="inline-start" />
        )}
        {isEditing ? "Готово" : "Редактировать"}
      </Button>
    </div>
  );
}
