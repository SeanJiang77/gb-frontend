import React, { useState } from "react";
import { addPlayer, getRoom } from "../api/rooms";
import useRoomStore from "../store/roomStore";

export default function PlayerSetup({ onNext }) {
  const { room, setRoom } = useRoomStore();
  const [seat, setSeat] = useState(1);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!room?._id) return <div className="card">请先创建房间</div>;

  const players = room.players || [];
  const requiredPlayers = Number.isInteger(room.playerCount) ? room.playerCount : room.meta?.expectedPlayers ?? 0;
  const blockers = [];

  if (players.length !== requiredPlayers) {
    blockers.push(`当前玩家数为 ${players.length}，必须精确等于预设人数 ${requiredPlayers} 才能进入发牌。`);
  }
  if (Array.isArray(room.meta?.readyIssues)) {
    blockers.push(...room.meta.readyIssues);
  }

  const uniqueBlockers = [...new Set(blockers)];
  const canProceed = uniqueBlockers.length === 0;

  const add = async () => {
    setLoading(true); setError("");
    try {
      const updated = await addPlayer(room._id, { seat: Number(seat), nickname });
      setRoom(updated);
      setNickname("");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const refresh = async () => {
    const r = await getRoom(room._id);
    setRoom(r);
  };

  return (
    <div className="card space-y-4">
      <h2 className="text-xl font-semibold">玩家设置</h2>
      <div className="text-sm text-gray-600">
        目标人数：<b>{requiredPlayers}</b> · 当前人数：<b>{players.length}</b>
      </div>

      <div>
        <button className="btn-primary w-full sm:w-auto" onClick={onNext} disabled={!canProceed}>继续到发牌</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="label">座位号</label>
          <input className="input" type="number" min={1} value={seat} onChange={(e) => setSeat(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <label className="label">昵称</label>
          <input className="input" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button className="btn-primary w-full sm:w-auto" onClick={add} disabled={loading || !nickname}>{loading ? "添加中..." : "添加玩家"}</button>
        <button className="btn-secondary w-full sm:w-auto" onClick={refresh}>刷新</button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
      </div>

      {!canProceed && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 space-y-1">
          {uniqueBlockers.map((item) => (
            <div key={item}>- {item}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {[...players].sort((a,b)=>a.seat-b.seat).map(p => (
          <div key={p.seat} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="font-medium">{p.nickname}</div>
              <div className="text-sm text-gray-500">座位 {p.seat} · {p.alive ? <span className="badge">存活</span> : <span className="badge">死亡</span>}</div>
            </div>
            <div className="text-xs text-gray-400 sm:text-right">{p.role || "未分配"}</div>
          </div>
        ))}
      </div>

      <div>
        <button className="btn-primary w-full sm:w-auto" onClick={onNext} disabled={!canProceed}>继续到发牌</button>
      </div>
    </div>
  );
}
