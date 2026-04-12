import React from "react";
import { SUPPORTED_LOCALES } from "../i18n/index.js";

export default function LanguageSwitcher({ locale, setLocale, t }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <span className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        {t("common.languageLabel")}
      </span>
      {SUPPORTED_LOCALES.map((item) => (
        <button
          key={item}
          type="button"
          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
            item === locale ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"
          }`}
          onClick={() => setLocale(item)}
        >
          {t(`common.languageNames.${item}`)}
        </button>
      ))}
    </div>
  );
}
