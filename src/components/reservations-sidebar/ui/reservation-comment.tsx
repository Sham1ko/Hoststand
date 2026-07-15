"use client";

import { useState } from "react";
import {
  Languages,
  LoaderCircle,
  MessageSquareText,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getTranslationLanguage,
  translationLanguages,
  type TranslationLanguage,
} from "@/features/comment-translation/model/languages";

type TranslationResponse = {
  translation?: string;
  error?: string;
};

type ReservationCommentProps = {
  comment: string;
};

export function ReservationComment({ comment }: ReservationCommentProps) {
  const [open, setOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] =
    useState<TranslationLanguage>();
  const [pendingLanguage, setPendingLanguage] =
    useState<TranslationLanguage>();
  const [translations, setTranslations] = useState<
    Partial<Record<TranslationLanguage, string>>
  >({});
  const [error, setError] = useState<string>();

  const activeTranslation = activeLanguage
    ? translations[activeLanguage]
    : undefined;
  const activeLanguageOption = activeLanguage
    ? getTranslationLanguage(activeLanguage)
    : undefined;

  const translate = async (language: TranslationLanguage) => {
    const cachedTranslation = translations[language];

    if (cachedTranslation) {
      setActiveLanguage(language);
      setError(undefined);
      setOpen(false);
      return;
    }

    setPendingLanguage(language);
    setError(undefined);

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: comment, language }),
      });
      const result = (await response.json().catch(() => ({}))) as TranslationResponse;

      if (!response.ok || !result.translation) {
        throw new Error(result.error ?? "Не удалось перевести комментарий");
      }

      setTranslations((current) => ({
        ...current,
        [language]: result.translation,
      }));
      setActiveLanguage(language);
      setOpen(false);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось перевести комментарий",
      );
    } finally {
      setPendingLanguage(undefined);
    }
  };

  return (
    <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
      <div className="flex items-start gap-2">
        <MessageSquareText
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0"
        />
        <p className="min-w-0 flex-1 break-words leading-relaxed">
          {activeTranslation ?? comment}
        </p>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="-my-1 shrink-0 text-slate-500 hover:bg-white hover:text-primary"
                disabled={pendingLanguage !== undefined}
                aria-label="Перевести комментарий"
              />
            }
          >
            {pendingLanguage ? (
              <LoaderCircle
                aria-hidden="true"
                className="animate-spin"
                data-icon="inline-start"
              />
            ) : (
              <Languages aria-hidden="true" data-icon="inline-start" />
            )}
            Перевести
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-44 gap-1 p-1.5"
            aria-label="Язык перевода"
          >
            {translationLanguages.map((language) => (
              <button
                key={language.value}
                type="button"
                className="flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                disabled={pendingLanguage !== undefined}
                onClick={() => void translate(language.value)}
              >
                <span className="grid min-w-7 place-items-center rounded bg-slate-100 px-1 py-0.5 text-[10px] font-semibold text-slate-500">
                  {language.shortLabel}
                </span>
                {language.label}
                {pendingLanguage === language.value && (
                  <LoaderCircle
                    aria-hidden="true"
                    className="ml-auto size-3.5 animate-spin text-primary"
                  />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {activeTranslation && activeLanguageOption && (
        <div className="mt-1.5 flex items-center gap-2 border-t border-slate-200/70 pt-1.5 pl-5.5 text-[10px] text-slate-400">
          <span>Перевод · {activeLanguageOption.label}</span>
          <button
            type="button"
            className="ml-auto inline-flex items-center gap-1 font-medium text-slate-500 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            onClick={() => setActiveLanguage(undefined)}
          >
            <RotateCcw aria-hidden="true" className="size-2.5" />
            Оригинал
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1.5 pl-5.5 text-[11px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
