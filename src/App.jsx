import React, { useEffect, useMemo, useState } from "react";
import RoomCreate from "./pages/RoomCreate.jsx";
import PlayerSetup from "./pages/PlayerSetup.jsx";
import RoleAssign from "./pages/RoleAssign.jsx";
import GMPanel from "./pages/GMPanel.jsx";
import LogPanel from "./pages/LogPanel.jsx";
import useRoomStore from "./store/roomStore.js";

export default function App() {
  const [tab, setTab] = useState("create");
  const { room } = useRoomStore();
  const hasRoom = Boolean(room?._id);
  const gameStarted = hasRoom && room.status !== "init";
  const playersCount = room?.players?.length ?? 0;
  const requiredPlayers = Number.isInteger(room?.playerCount) ? room.playerCount : room?.meta?.expectedPlayers ?? 0;
  const readyIssues = room?.meta?.readyIssues ?? [];
  const assignReady = hasRoom && playersCount === requiredPlayers && readyIssues.length === 0;

  const tabs = useMemo(
    () => [
      { key: "create", label: "创建房间", disabled: hasRoom },
      { key: "players", label: "玩家设置", disabled: !hasRoom || gameStarted },
      { key: "assign", label: "发牌", disabled: !assignReady || gameStarted },
      { key: "gm", label: "主持面板", disabled: !gameStarted },
      { key: "log", label: "日志 / 撤销", disabled: !gameStarted },
    ],
    [assignReady, gameStarted, hasRoom]
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

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-3 sm:p-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">GodsBooklet 主持工具</h1>
        <div className="break-all text-sm text-gray-500">{room?._id ? `房间ID：${room._id}` : "请先创建房间"}</div>
      </header>

      <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`btn w-full justify-center ${tab === t.key ? "btn-primary" : "btn-secondary"} ${
              t.disabled ? "cursor-not-allowed opacity-50" : ""
            }`}
            onClick={() => !t.disabled && setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {!gameStarted && hasRoom && tab !== "create" && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          当前流程必须按顺序进行：创建房间 - 玩家设置 - 发牌 - 主持面板。游戏开始后将锁定前置步骤，不能返回修改。
        </div>
      )}

      {tab === "create" && <RoomCreate onNext={() => setTab("players")} />}
      {tab === "players" && <PlayerSetup onNext={() => setTab("assign")} />}
      {tab === "assign" && <RoleAssign onNext={() => setTab("gm")} />}
      {tab === "gm" && <GMPanel onNext={() => setTab("log")} />}
      {tab === "log" && <LogPanel />}
    </div>
  );
}
