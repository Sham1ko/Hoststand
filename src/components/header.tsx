"use client";

import Image from "next/image";

import { ResetDemoDialog } from "@/components/reset-demo-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import { MOCK_API_ENABLED } from "@/client/restaurant/api/data-source";

export function Header() {
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

        <ResetDemoDialog />

        {MOCK_API_ENABLED && <SettingsDialog />}
      </div>
    </header>
  );
}
