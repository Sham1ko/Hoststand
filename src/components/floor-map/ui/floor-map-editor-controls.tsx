import { Check, Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export type FloorMapEditorTool = "tables" | "zones";

type FloorMapEditorControlsProps = {
  isEditing: boolean;
  isSaving: boolean;
  tool: FloorMapEditorTool;
  onStart: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCreateTable: () => void;
  onCreateZone: () => void;
  onToolChange: (tool: FloorMapEditorTool) => void;
};

export function FloorMapEditorControls({
  isEditing,
  isSaving,
  tool,
  onStart,
  onSave,
  onCancel,
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
      {isEditing ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Отменить редактирование"
            disabled={isSaving}
            onClick={onCancel}
          >
            <X aria-hidden="true" data-icon="inline-start" />
            Отмена
          </Button>
          <Button
            type="button"
            size="sm"
            title="Сохранить изменения"
            disabled={isSaving}
            onClick={onSave}
          >
            <Check aria-hidden="true" data-icon="inline-start" />
            Сохранить
          </Button>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Редактировать столы"
          onClick={onStart}
        >
          <Pencil aria-hidden="true" data-icon="inline-start" />
          Редактировать
        </Button>
      )}
    </div>
  );
}


