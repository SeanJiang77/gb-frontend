import React, { useState } from "react";
import { createRoom } from "../api/rooms";
import useRoomStore from "../store/roomStore";
import { getPresetPlayerCount } from "../constants/presets";

export default function CreateRoom({ onNext, t }) {
  const { setRoom } = useRoomStore();
  const [name, setName] = useState(() => t?.("roomCreate.defaults.name") ?? "新房间");
  const [maxSeats, setMaxSeats] = useState(12);
  const [presetKey, setPresetKey] = useState("12p-classic");
  const [mode, setMode] = useState("flex");
  const [initialPlayers, setInitialPlayers] = useState(getPresetPlayerCount("12p-classic"));
  const requiredPlayers = getPresetPlayerCount(presetKey);

  const onSubmit = async (e) => {
    e.preventDefault();
    const room = await createRoom({
      name,
      maxSeats: Number(maxSeats),
      presetKey,
      mode,
      initialPlayers: Number(initialPlayers),
      playerCount: requiredPlayers,
    });
    setRoom(room);
    onNext?.();
  };

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel--dense">
        <div className="section-kicker">Step 1</div>
        <h2 className="mt-2 section-title sm:text-2xl">{t?.("page.roomCreateTitle") ?? "创建房间"}</h2>
        <p className="mt-2 page-copy">{t?.("page.roomCreateBody") ?? "先确定局配置和目标人数，后续流程会严格按这个配置推进。"}</p>
      </section>

      <form onSubmit={onSubmit} className="card space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="label">{t("roomCreate.fields.name")}</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("roomCreate.fields.maxSeats")}</label>
            <input className="input" type="number" min={requiredPlayers} value={maxSeats} onChange={(e) => setMaxSeats(e.target.value)} />
          </div>
          <div>
            <label className="label">{t("roomCreate.fields.preset")}</label>
            <select
              className="input"
              value={presetKey}
              onChange={(e) => {
                const nextPreset = e.target.value;
                const nextCount = getPresetPlayerCount(nextPreset);
                setPresetKey(nextPreset);
                setMaxSeats(nextCount);
                setInitialPlayers(nextCount);
              }}
            >
              <option value="12p-classic">{t("roomCreate.presets.classic12")}</option>
              <option value="9p-classic">{t("roomCreate.presets.classic9")}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("roomCreate.fields.mode")}</label>
            <select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="flex">{t("roomCreate.modes.flex")}</option>
              <option value="strict">{t("roomCreate.modes.strict")}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("roomCreate.fields.requiredPlayers")}</label>
            <input className="input bg-slate-50" value={t("common.countPeople", { count: requiredPlayers })} disabled readOnly />
          </div>
          <div>
            <label className="label">{t("roomCreate.fields.initialPlayers")}</label>
            <input className="input" type="number" min={0} max={requiredPlayers} value={initialPlayers} onChange={(e) => setInitialPlayers(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="stat-tile">
            <div className="stat-label">{t("roomCreate.stats.mode")}</div>
            <div className="stat-value">{mode === "strict" ? t("roomCreate.modes.strict") : t("roomCreate.modes.flex")}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">{t("roomCreate.stats.requiredPlayers")}</div>
            <div className="stat-value">{t("common.countPeople", { count: requiredPlayers })}</div>
          </div>
          <div className="stat-tile">
            <div className="stat-label">{t("roomCreate.stats.initialPlayers")}</div>
            <div className="stat-value">{t("common.countPeople", { count: initialPlayers })}</div>
          </div>
        </div>

        <button className="btn-primary w-full justify-center sm:w-auto" type="submit">{t("roomCreate.actions.submit")}</button>
      </form>
    </div>
  );
}
