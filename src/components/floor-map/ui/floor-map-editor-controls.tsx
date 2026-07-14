import { Check, Pencil, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type FloorMapEditorControlsProps = {
  isEditing: boolean;
  isSaving: boolean;
  onStart: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCreateTable: () => void;
  onCreateZone: () => void;
};

export function FloorMapEditorControls({
  isEditing,
  isSaving,
  onStart,
  onSave,
  onCancel,
  onCreateTable,
  onCreateZone,
}: FloorMapEditorControlsProps) {
  return (
    <div className="flex items-center gap-1">
      {isEditing && (
        <>
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            title="Добавить зону"
            onClick={onCreateZone}
          >
            <Plus aria-hidden="true" data-icon="inline-start" />
            Зона
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
          title="Редактировать план зала"
          onClick={onStart}
        >
          <Pencil aria-hidden="true" data-icon="inline-start" />
          Редактировать
        </Button>
      )}
    </div>
  );
}

