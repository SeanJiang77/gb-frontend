import React, { useState } from "react";
import { undo, getRoom } from "../api/rooms";
import useRoomStore from "../store/roomStore";

export default function LogPanel({ t }) {
  const { room, setRoom } = useRoomStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [eventId, setEventId] = useState("");

  if (!room?._id) return <div className="card">{t("common.roomIdEmpty")}</div>;

  const refresh = async () => setRoom(await getRoom(room._id));

  const doUndo = async () => {
    if (!eventId) return;
    setLoading(true);
    setError("");
    try {
      const updated = await undo(room._id, { eventId });
      setRoom(updated);
      setEventId("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const events = (room.log || []).slice().reverse();

  return (
    <div className="page-stack">
      <section className="surface-panel surface-panel--dense">
        <div className="section-kicker">Step 5</div>
        <h2 className="mt-2 section-title sm:text-2xl">{t?.("page.logTitle") ?? "日志与撤销"}</h2>
        <p className="mt-2 page-copy">{t?.("page.logBody") ?? "查看最新事件、定位操作记录，并对最新事件执行安全撤销。"}</p>
      </section>

      <section className="card space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input className="input" placeholder={t("log.fields.eventId")} value={eventId} onChange={(e) => setEventId(e.target.value)} />
          <button className="btn-secondary w-full justify-center sm:w-auto" onClick={doUndo} disabled={loading || !eventId}>{t("common.undo")}</button>
          <button className="btn-secondary w-full justify-center sm:w-auto" onClick={refresh}>{t("common.refresh")}</button>
        </div>
        {error && <div className="info-box--danger">{error}</div>}
      </section>

      <section className="card">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-950">{t("log.list.title")}</h3>
          <div className="text-xs text-slate-400">{t("log.list.orderHint")}</div>
        </div>

        <ul className="space-y-3 max-h-[520px] overflow-auto pr-1">
          {events.map((ev) => (
            <li key={ev._id} className="stat-tile bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-900">[{new Date(ev.at).toLocaleTimeString()}] {ev.phase} · {ev.actor || t("common.system")}</div>
                  {ev.targetSeat != null && <div className="text-sm text-slate-600">{t("log.list.targetSeat", { seat: ev.targetSeat })}</div>}
                  {ev.note && <div className="text-sm text-slate-600">{t("log.list.note", { note: ev.note })}</div>}
                </div>
                <code className="break-all rounded-xl bg-slate-50 px-2 py-1 text-xs text-slate-400">{ev._id}</code>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {room.status === "end" && (
        <div className="info-box border-emerald-200 bg-emerald-50 text-emerald-800">
          {t("log.exportReady")}
        </div>
      )}
    </div>
  );
}
