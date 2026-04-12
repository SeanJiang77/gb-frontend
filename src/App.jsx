import React, { useEffect, useMemo, useState } from "react";
import ToolShell from "./components/ToolShell.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { ROUTES, normalizeRoute } from "./app/routes.js";
import { createTranslator, useLocaleState } from "./i18n/index.js";

export default function App() {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.pathname));
  const [locale, setLocale] = useLocaleState();
  const t = useMemo(() => createTranslator(locale), [locale]);

  useEffect(() => {
    const onPopState = () => setRoute(normalizeRoute(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (nextRoute) => {
    if (window.location.pathname !== nextRoute) {
      window.history.pushState({}, "", nextRoute);
    }
    setRoute(normalizeRoute(nextRoute));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (route === ROUTES.app) {
    return <ToolShell t={t} locale={locale} setLocale={setLocale} onBackHome={() => navigate(ROUTES.landing)} />;
  }

  if (route === ROUTES.notFound) {
    return (
      <NotFoundPage
        t={t}
        locale={locale}
        setLocale={setLocale}
        onOpenApp={() => navigate(ROUTES.app)}
        onGoHome={() => navigate(ROUTES.landing)}
      />
    );
  }

  return <LandingPage t={t} locale={locale} setLocale={setLocale} onOpenApp={() => navigate(ROUTES.app)} />;
}
