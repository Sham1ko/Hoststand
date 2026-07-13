"use client";

import { RotateCcw } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { RESERVATIONS_CHANGED_EVENT } from "@/features/reservations/lib/events";

export function Header() {
  const handleReset = () => {
    fetch("/api/reset", { method: "POST" }).then((response) => {
      if (response.ok) {
        window.dispatchEvent(new Event(RESERVATIONS_CHANGED_EVENT));
      }
    });
  };

  return (
    <header className="h-16 flex items-center border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full items-center gap-3 px-4">
        <Image
          src="/qolay.png"
          alt="Логотип Qolay"
          width={48}
          height={48}
          priority
          className="size-8 rounded-lg"
        />

        <div>
          <p className="text-sm font-semibold text-slate-950">
            Qolay Admin
          </p>
          <p className="text-xs text-slate-400">
            Столы и брони
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={handleReset}
        >
          <RotateCcw aria-hidden="true" data-icon="inline-start" />
          Сбросить брони
        </Button>
      </div>
    </header>
  );
}
