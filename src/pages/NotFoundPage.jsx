import React from "react";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function NotFoundPage({ t, locale, setLocale, onOpenApp, onGoHome }) {
  return (
    <div className="font-brand-serif min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <div className="surface-panel w-full max-w-xl text-center">
          <div className="mb-4 flex justify-center">
            <LanguageSwitcher locale={locale} setLocale={setLocale} t={t} />
          </div>
          <div className="section-kicker">404</div>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{t("common.notFoundTitle")}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t("common.notFoundBody")}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button type="button" className="btn-primary w-full justify-center sm:w-auto" onClick={onOpenApp}>
              {t("common.openApp")}
            </button>
            <button type="button" className="btn-secondary w-full justify-center sm:w-auto" onClick={onGoHome}>
              {t("common.backToHome")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
