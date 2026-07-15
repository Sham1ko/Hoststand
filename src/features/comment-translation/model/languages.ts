export const translationLanguageCodes = ["ru", "en", "kk", "zh"] as const;

export type TranslationLanguage =
  (typeof translationLanguageCodes)[number];

export const translationLanguages: ReadonlyArray<{
  value: TranslationLanguage;
  label: string;
  shortLabel: string;
}> = [
  { value: "ru", label: "Русский", shortLabel: "RU" },
  { value: "en", label: "English", shortLabel: "EN" },
  { value: "kk", label: "Қазақша", shortLabel: "KK" },
  { value: "zh", label: "中文", shortLabel: "中文" },
];

export function getTranslationLanguage(language: TranslationLanguage) {
  return translationLanguages.find((option) => option.value === language);
}
