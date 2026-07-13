import { Check, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type FloorMapEditorControlsProps = {
  isEditing: boolean;
  onToggle: () => void;
  onCreateTable: () => void;
};

export function FloorMapEditorControls({
  isEditing,
  onToggle,
  onCreateTable,
}: FloorMapEditorControlsProps) {
  return (
    <div className="flex items-center gap-1">
      {isEditing && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          title="Добавить стол"
          onClick={onCreateTable}
        >
          <Plus aria-hidden="true" data-icon="inline-start" />
          Стол
        </Button>
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
