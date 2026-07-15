"use client";

import { useState } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";

import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ResetDemoDialog() {
  const { resetDemo } = useRestaurant();
  const [open, setOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await resetDemo();
    setIsResetting(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
          />
        }
      >
        <RotateCcw aria-hidden="true" data-icon="inline-start" />
        Сбросить демо
      </DialogTrigger>

      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton={!isResetting}
      >
        <DialogHeader className="px-6 pt-6 pb-5">
          <div className="mb-4 flex size-10 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
            <TriangleAlert aria-hidden="true" className="size-5" />
          </div>
          <DialogTitle className="text-lg font-semibold tracking-tight text-slate-950">
            Сбросить демо-данные?
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-5 text-slate-500">
            Все текущие столы, зоны и брони будут заменены исходными seed-данными.
            Отменить это действие будет невозможно.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <DialogClose
            render={
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={isResetting}
              />
            }
          >
            Отмена
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={isResetting}
            onClick={() => void handleReset()}
          >
            <RotateCcw aria-hidden="true" data-icon="inline-start" />
            {isResetting ? "Сбрасываем…" : "Сбросить данные"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
