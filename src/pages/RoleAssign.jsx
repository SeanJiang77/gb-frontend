import React, { useState } from "react";
import { assignRoles } from "../api/rooms";
import useRoomStore from "../store/roomStore";

export default function RoleAssign({ onNext, t }) {
  const { room, setRoom } = useRoomStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!room?._id) return <div className="card">{t("common.roomIdEmpty")}</div>;

  const players = room.players || [];
  const requiredPlayers = Number.isInteger(room.playerCount) ? room.playerCount : room.meta?.expectedPlayers ?? 0;
  const blockers = [];

  if (players.length !== requiredPlayers) {
    blockers.push(t("roleAssign.blockers.exactCount", { current: players.length, required: requiredPlayers }));
  }
  if (Array.isArray(room.meta?.readyIssues)) {
    blockers.push(...room.meta.readyIssues);
  }

  const uniqueBlockers = [...new Set(blockers)];
  const canAssign = uniqueBlockers.length === 0;

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await assignRoles(room._id, {});
      setRoom(updated);
      onNext?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel--dense">
        <div className="section-kicker">Step 3</div>
        <h2 className="mt-2 section-title sm:text-2xl">{t?.("page.roleAssignTitle") ?? "发牌"}</h2>
        <p className="mt-2 page-copy">{t?.("page.roleAssignBody") ?? "确认人数和配置无误后开始发牌，发牌后立即进入夜晚。"}</p>
      </section>

      {!canAssign && (
        <div className="notice-banner space-y-1">
          {uniqueBlockers.map((item) => (
            <div key={item}>- {item}</div>
          ))}
        </div>
      )}

      <section className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="stat-tile">
            <div className="stat-label">{t("roleAssign.stats.targetPlayers")}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{requiredPlayers}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">{t("roleAssign.stats.currentPlayers")}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{players.length}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">{t("roleAssign.stats.state")}</div>
            <div className={`mt-1 text-sm font-semibold ${canAssign ? "text-emerald-700" : "text-amber-700"}`}>{canAssign ? t("roleAssign.states.ready") : t("roleAssign.states.blocked")}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button className="btn-primary w-full justify-center sm:w-auto" onClick={run} disabled={loading || !canAssign}>
            {loading ? t("roleAssign.actions.assigning") : t("roleAssign.actions.assign")}
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-950">{t("roleAssign.list.title")}</h3>
          <div className="text-xs text-slate-400">{t("roleAssign.list.hint")}</div>
        </div>
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[...players].sort((a, b) => a.seat - b.seat).map((p) => (
            <li key={p.seat} className="stat-tile bg-white">
              <div className="break-words text-sm font-semibold text-slate-950">{t("roleAssign.list.seatAndName", { seat: p.seat, nickname: p.nickname })}</div>
              <div className="mt-1 text-sm text-slate-500">{t("roleAssign.list.roleValue", { role: p.role || t("common.unassigned") })}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
