import React from "react";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";

export default function LandingPage({ t, locale, setLocale, onOpenApp }) {
  const features = t("landing.features");
  const flow = t("landing.flow");
  const featureLead = features.slice(0, 3);
  const featureTail = features.slice(3);
  const updates = t("landing.updates.items");

  return (
    <div className="page-shell font-brand-serif">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-2">
          <div>
            <div className="brand-mark">{t("landing.eyebrow")}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{t("brand.name")}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <LanguageSwitcher locale={locale} setLocale={setLocale} t={t} />
            <button type="button" className="btn-primary" onClick={onOpenApp}>
              {t("landing.primaryCta")}
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8">
          <section className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div className="surface-panel space-y-5">
              <div className="brand-mark">{t("brand.tagline")}</div>
              <h1 className="text-balance text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                {t("landing.title")}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{t("landing.body")}</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="button" className="btn-primary w-full justify-center sm:w-auto" onClick={onOpenApp}>
                  {t("landing.primaryCta")}
                </button>
                <a href="#flow" className="btn-secondary w-full justify-center sm:w-auto">
                  {t("landing.secondaryCta")}
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[linear-gradient(160deg,rgba(15,23,42,0.98),rgba(30,41,59,0.96),rgba(51,65,85,0.92))] p-5 text-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] sm:p-6">
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                <div className="absolute -right-10 top-0 h-36 w-36 rounded-full bg-cyan-300/12 blur-3xl" />
                <div className="absolute left-6 top-20 h-28 w-28 rounded-full bg-white/8 blur-2xl" />
                <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-indigo-300/10 blur-3xl" />
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
                    Live Moderator View
                  </div>
                  <div className="text-xs text-slate-300">Mobile-first</div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Current Room</div>
                        <div className="mt-2 text-lg font-semibold">12-player classic</div>
                      </div>
                      <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                        Ready
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Players</div>
                        <div className="mt-1 text-sm font-semibold text-white">12 / 12</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Stage</div>
                        <div className="mt-1 text-sm font-semibold text-white">Night</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Log</div>
                        <div className="mt-1 text-sm font-semibold text-white">Tracked</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Flow Snapshot</div>
                      <div className="mt-3 space-y-2">
                        {flow.slice(0, 4).map((item, index) => (
                          <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-3 py-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-100">
                              {index + 1}
                            </div>
                            <div className="text-sm text-slate-100">{item}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-300">Latest Event</div>
                      <div className="mt-3 rounded-2xl border border-white/8 bg-slate-950/35 px-3 py-3">
                        <div className="text-sm font-semibold text-white">Night resolved</div>
                        <div className="mt-1 text-sm leading-6 text-slate-300">
                          Logs, prompts, and actions stay aligned in one place.
                        </div>
                      </div>
                      <div className="mt-3 rounded-2xl border border-dashed border-white/10 px-3 py-3 text-sm text-slate-400">
                        Replace this visual with a real product screenshot or illustration later.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-3 lg:grid-cols-3">
            {featureLead.map((item) => (
              <article key={item.title} className="surface-panel surface-panel--dense">
                <h2 className="section-title">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
              </article>
            ))}
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <article className="surface-panel surface-panel--dense">
              <div className="section-kicker">{t("landing.whyTitle")}</div>
              <p className="mt-3 page-copy">{t("landing.whyBody")}</p>
              {featureTail.length > 0 && (
                <div className="mt-5 grid gap-3">
                  {featureTail.map((item) => (
                    <div key={item.title} className="stat-tile bg-white">
                      <div className="stat-value mt-0">{item.title}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">{item.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article id="flow" className="surface-panel">
              <div className="section-kicker">{t("landing.flowTitle")}</div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {flow.map((item, index) => (
                  <div key={item} className="stat-tile bg-white/80">
                    <div className="stat-label">Step {index + 1}</div>
                    <div className="stat-value">{item}</div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6">
            <article className="surface-panel">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="section-kicker">{t("landing.updates.title")}</div>
                  <h2 className="section-title">{t("landing.updates.subtitle")}</h2>
                </div>
                <p className="max-w-xl text-sm leading-6 text-slate-600">
                  {t("landing.updates.description")}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {updates.map((item) => (
                  <div key={item.version} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>{item.version}</span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
