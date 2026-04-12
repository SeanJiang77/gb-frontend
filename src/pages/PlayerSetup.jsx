import React, { useState } from "react";
import { addPlayer, getRoom } from "../api/rooms";
import useRoomStore from "../store/roomStore";

export default function PlayerSetup({ onNext, t }) {
  const { room, setRoom } = useRoomStore();
  const [seat, setSeat] = useState(1);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!room?._id) return <div className="card">{t("common.roomIdEmpty")}</div>;

  const players = room.players || [];
  const requiredPlayers = Number.isInteger(room.playerCount) ? room.playerCount : room.meta?.expectedPlayers ?? 0;
  const blockers = [];

  if (players.length !== requiredPlayers) {
    blockers.push(t("playerSetup.blockers.exactCount", { current: players.length, required: requiredPlayers }));
  }
  if (Array.isArray(room.meta?.readyIssues)) {
    blockers.push(...room.meta.readyIssues);
  }

  const uniqueBlockers = [...new Set(blockers)];
  const canProceed = uniqueBlockers.length === 0;

  const add = async () => {
    setLoading(true);
    setError("");
    try {
      const updated = await addPlayer(room._id, { seat: Number(seat), nickname });
      setRoom(updated);
      setNickname("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    const r = await getRoom(room._id);
    setRoom(r);
  };

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel--dense">
        <div className="section-kicker">Step 2</div>
        <h2 className="mt-2 section-title sm:text-2xl">{t?.("page.playerSetupTitle") ?? "玩家设置"}</h2>
        <p className="mt-2 page-copy">{t?.("page.playerSetupBody") ?? "补齐玩家人数、座位和昵称后，才能进入发牌。"}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="stat-tile">
            <div className="stat-label">{t("playerSetup.stats.targetPlayers")}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{requiredPlayers}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">{t("playerSetup.stats.currentPlayers")}</div>
            <div className="mt-1 text-lg font-semibold text-slate-950">{players.length}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">{t("playerSetup.stats.progressState")}</div>
            <div className={`mt-1 text-sm font-semibold ${canProceed ? "text-emerald-700" : "text-amber-700"}`}>{canProceed ? t("playerSetup.states.ready") : t("playerSetup.states.blocked")}</div>
          </div>
        </div>
      </section>

      <div>
        <button className="btn-primary w-full justify-center sm:w-auto" onClick={onNext} disabled={!canProceed}>{t("playerSetup.actions.continue")}</button>
      </div>

      <section className="card space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="label">{t("playerSetup.fields.seat")}</label>
            <input className="input" type="number" min={1} value={seat} onChange={(e) => setSeat(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="label">{t("playerSetup.fields.nickname")}</label>
            <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button className="btn-primary w-full justify-center sm:w-auto" onClick={add} disabled={loading || !nickname}>
            {loading ? t("playerSetup.actions.adding") : t("playerSetup.actions.add")}
          </button>
          <button className="btn-secondary w-full justify-center sm:w-auto" onClick={refresh}>{t("common.refresh")}</button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </section>

      {!canProceed && (
        <div className="notice-banner space-y-1">
          {uniqueBlockers.map((item) => (
            <div key={item}>- {item}</div>
          ))}
        </div>
      )}

      <section className="card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-950">{t("playerSetup.list.title")}</h3>
          <div className="text-xs text-slate-400">{t("playerSetup.list.sortHint")}</div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {[...players].sort((a, b) => a.seat - b.seat).map((p) => (
            <div key={p.seat} className="stat-tile bg-white">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="break-words text-sm font-semibold text-slate-950">{p.nickname}</div>
                  <div className="mt-1 text-xs text-slate-500">{t("common.seatValue", { seat: p.seat })}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge">{p.role || t("common.unassigned")}</span>
                  <span className="badge">{p.alive ? t("common.alive") : t("common.dead")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div>
        <button className="btn-primary w-full justify-center sm:w-auto" onClick={onNext} disabled={!canProceed}>{t("playerSetup.actions.continue")}</button>
      </div>
    </div>
  );
}
