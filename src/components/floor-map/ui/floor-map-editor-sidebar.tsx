import { PencilRuler } from "lucide-react";
import type { ReactNode } from "react";

type FloorMapEditorSidebarProps = {
  children?: ReactNode;
};

export function FloorMapEditorSidebar({
  children,
}: FloorMapEditorSidebarProps) {
  return (
    <aside
      aria-label="Редактор плана зала"
      className="flex min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-white"
    >
      {children ?? (
        <div className="flex min-h-0 flex-1 items-center justify-center px-8 pb-16 text-center">
          <div className="max-w-[19rem]">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <PencilRuler aria-hidden="true" className="size-6" />
            </div>

            <h2 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">
              Режим редактора
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Перетаскивайте столы мышью — при попадании в область зоны они
              привязываются к ней автоматически. Кнопка «Зона» добавит новую
              область. Зоны перемещаются за название и изменяются за маркер в
              углу. Колесо мыши — масштаб.
            </p>
          </div>
        </div>
      )}
    </aside>
  );
}
