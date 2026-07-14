import {
  Check,
  Circle,
  Pencil,
  RectangleHorizontal,
  Square,
  SquareDashed,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import type { TableShape } from "@/entities/table/model/types";

const tableCreationActions: {
  shape: TableShape;
  label: string;
  icon: LucideIcon;
}[] = [
  { shape: "round", label: "Круглый", icon: Circle },
  { shape: "square", label: "Квадрат", icon: Square },
  {
    shape: "rect",
    label: "Прямоугольный",
    icon: RectangleHorizontal,
  },
];

type FloorMapEditButtonProps = {
  onStart: () => void;
};

export function FloorMapEditButton({ onStart }: FloorMapEditButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      title="Редактировать план зала"
      onClick={onStart}
    >
      <Pencil aria-hidden="true" data-icon="inline-start" />
      Редактировать
    </Button>
  );
}

type FloorMapEditorDockProps = {
  floorStructureControl: ReactNode;
  onCreateTable: (shape: TableShape) => void;
  onCreateZone: () => void;
  isSaving: boolean;
  onSave: () => void;
  onCancel: () => void;
};

export function FloorMapEditorDock({
  floorStructureControl,
  onCreateTable,
  onCreateZone,
  isSaving,
  onSave,
  onCancel,
}: FloorMapEditorDockProps) {
  return (
    <div
      role="toolbar"
      aria-label="Редактирование плана зала"
      className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-[0_10px_30px_-14px_rgba(15,23,42,0.35)] backdrop-blur-sm"
    >
      {floorStructureControl}

      <div aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />

      <div className="flex items-center gap-0.5" aria-label="Добавить на план">
        <span className="px-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase @max-[58rem]/floor-map:hidden">
          Добавить:
        </span>
        {tableCreationActions.map((action) => {
          const Icon = action.icon;

          return (
            <Button
              key={action.shape}
              type="button"
              variant="ghost"
              size="lg"
              title={`Добавить ${action.label.toLocaleLowerCase()} стол`}
              onClick={() => onCreateTable(action.shape)}
            >
              <Icon aria-hidden="true" data-icon="inline-start" />
              <span className="@max-[58rem]/floor-map:sr-only">
                {action.label}
              </span>
            </Button>
          );
        })}
        <Button
          type="button"
          variant="ghost"
          size="lg"
          title="Добавить зону"
          onClick={onCreateZone}
        >
          <SquareDashed aria-hidden="true" data-icon="inline-start" />
          <span className="@max-[58rem]/floor-map:sr-only">Зона</span>
        </Button>
      </div>

      <div aria-hidden="true" className="mx-1 h-5 w-px bg-slate-200" />

      <Button
        type="button"
        variant="outline"
        size="lg"
        title="Отменить редактирование"
        disabled={isSaving}
        onClick={onCancel}
      >
        <X aria-hidden="true" data-icon="inline-start" />
        Отмена
      </Button>
      <Button
        type="button"
        size="lg"
        title="Сохранить изменения"
        disabled={isSaving}
        onClick={onSave}
      >
        <Check aria-hidden="true" data-icon="inline-start" />
        Сохранить
      </Button>
    </div>
  );
}
