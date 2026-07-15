"use client";

import { Settings } from "lucide-react";

import {
  MOCK_API_ENABLED,
  type DataSource,
} from "@/client/restaurant/api/data-source";
import { useRestaurant } from "@/client/restaurant/state/restaurant-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const dataSourceOptions: Array<{
  value: DataSource;
  title: string;
  description: string;
}> = [
  {
    value: "local-storage",
    title: "LocalStorage",
    description: "Данные хранятся в браузере и переживают перезагрузку страницы.",
  },
  {
    value: "mock-api",
    title: "Mock API",
    description: "Данные в памяти dev-сервера, сбрасываются при его перезапуске.",
  },
];

export function SettingsDialog() {
  const { dataSource, setDataSource } = useRestaurant();

  if (!MOCK_API_ENABLED) return null;

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Настройки"
          />
        }
      >
        <Settings aria-hidden="true" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Настройки</DialogTitle>
          <DialogDescription>Источник данных приложения</DialogDescription>
        </DialogHeader>

        <div
          role="radiogroup"
          aria-label="Источник данных"
          className="flex flex-col gap-2"
        >
          {dataSourceOptions.map((option) => {
            const isSelected = option.value === dataSource;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={`rounded-lg border p-3 text-left transition ${
                  isSelected
                    ? "border-primary bg-white ring-2 ring-primary/15"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
                onClick={() => setDataSource(option.value)}
              >
                <p className="text-sm font-medium text-slate-900">
                  {option.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
