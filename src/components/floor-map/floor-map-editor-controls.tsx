import { Check, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

type FloorMapEditorControlsProps = {
  isEditing: boolean;
  onToggle: () => void;
};

export function FloorMapEditorControls({
  isEditing,
  onToggle,
}: FloorMapEditorControlsProps) {
  return (
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
  );
}
