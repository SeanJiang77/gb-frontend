import React, { useEffect, useMemo, useState } from "react";
import RoomCreate from "../pages/RoomCreate.jsx";
import PlayerSetup from "../pages/PlayerSetup.jsx";
import RoleAssign from "../pages/RoleAssign.jsx";
import GMPanel from "../pages/GMPanel.jsx";
import LogPanel from "../pages/LogPanel.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";
import useRoomStore from "../store/roomStore.js";

export default function ToolShell({ t, locale, setLocale, onBackHome }) {
  const [tab, setTab] = useState("create");
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.matchMedia("(min-width: 640px)").matches;
  });
  const { room } = useRoomStore();
  const hasRoom = Boolean(room?._id);
  const gameStarted = hasRoom && room.status !== "init";
  const playersCount = room?.players?.length ?? 0;
  const requiredPlayers = Number.isInteger(room?.playerCount) ? room.playerCount : room?.meta?.expectedPlayers ?? 0;
  const readyIssues = room?.meta?.readyIssues ?? [];
  const assignReady = hasRoom && playersCount === requiredPlayers && readyIssues.length === 0;

  const tabs = useMemo(
    () => [
      { key: "create", label: t("nav.create"), disabled: hasRoom },
      { key: "players", label: t("nav.players"), disabled: !hasRoom || gameStarted },
      { key: "assign", label: t("nav.assign"), disabled: !assignReady || gameStarted },
      { key: "gm", label: t("nav.gm"), disabled: !gameStarted },
      { key: "log", label: t("nav.log"), disabled: !gameStarted },
    ],
    [assignReady, gameStarted, hasRoom, t]
  );

  useEffect(() => {
    if (!hasRoom && tab !== "create") {
      setTab("create");
      return;
    }
    if (gameStarted && ["create", "players", "assign"].includes(tab)) {
      setTab("gm");
      return;
    }
    if (!gameStarted && ["gm", "log"].includes(tab)) {
      setTab(assignReady ? "assign" : hasRoom ? "players" : "create");
      return;
    }
    if (!assignReady && tab === "assign") {
      setTab(hasRoom ? "players" : "create");
    }
  }, [assignReady, gameStarted, hasRoom, tab]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(min-width: 640px)");
    const syncExpanded = (event) => {
      setIsHeaderExpanded(event.matches);
    };

    setIsHeaderExpanded(media.matches);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", syncExpanded);
      return () => media.removeEventListener("change", syncExpanded);
    }

    media.addListener(syncExpanded);
    return () => media.removeListener(syncExpanded);
  }, []);

  return (
    <div className="font-app-sans mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <div className="space-y-3 sm:space-y-4">
        <header className="surface-panel surface-panel--dense">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {isHeaderExpanded && <div className="brand-mark">{t("tool.subtitle")}</div>}
                <h1 className={`page-title ${isHeaderExpanded ? "mt-2" : ""}`}>{t("tool.title")}</h1>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <LanguageSwitcher locale={locale} setLocale={setLocale} t={t} />
                <button
                  type="button"
                  className="inline-flex min-h-9 items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
                  onClick={() => setIsHeaderExpanded((value) => !value)}
                  aria-expanded={isHeaderExpanded}
                >
                  {isHeaderExpanded ? t("tool.headerCollapse") : t("tool.headerExpand")}
                </button>
              </div>
            </div>

            {isHeaderExpanded && (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button type="button" className="btn-secondary w-full justify-center sm:w-auto" onClick={onBackHome}>
                    {t("common.backToHome")}
                  </button>
                  <div className="w-full rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-500 sm:w-auto sm:bg-transparent sm:px-0 sm:py-0 sm:text-sm">
                    {room?._id ? t("common.roomIdValue", { id: room._id }) : t("common.roomIdEmpty")}
                  </div>
                </div>

                <nav className="hide-scrollbar -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
                  {tabs.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`step-pill shrink-0 snap-start ${tab === item.key ? "step-pill--active" : ""} ${
                        item.disabled ? "step-pill--disabled" : ""
                      }`}
                      onClick={() => !item.disabled && setTab(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </>
            )}
          </div>
        </header>

        {!gameStarted && hasRoom && tab !== "create" && <div className="notice-banner">{t("tool.flowNotice")}</div>}

        {tab === "create" && <RoomCreate onNext={() => setTab("players")} t={t} />}
        {tab === "players" && <PlayerSetup onNext={() => setTab("assign")} t={t} />}
        {tab === "assign" && <RoleAssign onNext={() => setTab("gm")} t={t} />}
        {tab === "gm" && <GMPanel onNext={() => setTab("log")} t={t} />}
        {tab === "log" && <LogPanel t={t} />}
      </div>
    </div>
  );
}
