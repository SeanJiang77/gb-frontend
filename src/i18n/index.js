import { useEffect, useState } from "react";
import { messages } from "./messages.js";

export const DEFAULT_LOCALE = "zh-CN";
export const SUPPORTED_LOCALES = ["zh-CN", "en"];
export const LOCALE_STORAGE_KEY = "gb_locale";

function getByPath(source, path) {
  return path.split(".").reduce((value, key) => (value == null ? undefined : value[key]), source);
}

function interpolate(template, vars) {
  if (typeof template !== "string" || !vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ""));
}

export function detectLocale() {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && messages[stored]) return stored;
  }
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const locale = navigator.language || DEFAULT_LOCALE;
  return messages[locale] ? locale : DEFAULT_LOCALE;
}

export function useLocaleState() {
  const [locale, setLocale] = useState(() => detectLocale());

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  }, [locale]);

  return [locale, setLocale];
}

export function createTranslator(locale = DEFAULT_LOCALE) {
  return (key, vars) => {
    const current = getByPath(messages[locale], key);
    const fallback = getByPath(messages[DEFAULT_LOCALE], key);
    return interpolate(current ?? fallback ?? key, vars);
  };
}
