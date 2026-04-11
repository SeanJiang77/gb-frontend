import React, { useState } from "react";
import { createRoom } from "../api/rooms";
import useRoomStore from "../store/roomStore";
import { getPresetPlayerCount } from "../constants/presets";

export default function CreateRoom({ onNext }) {
  const { setRoom } = useRoomStore();
  const [name, setName] = useState("新房间");
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
    <form onSubmit={onSubmit} className="card space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="label">房间名称</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label className="label">最大座位数</label>
          <input className="input" type="number" min={requiredPlayers} value={maxSeats}
                 onChange={e=>setMaxSeats(e.target.value)} />
        </div>
        <div>
          <label className="label">预设</label>
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
            <option value="12p-classic">12人经典</option>
            <option value="9p-classic">9人经典</option>
          </select>
        </div>
        <div>
          <label className="label">模式</label>
          <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
            <option value="flex">灵活</option>
            <option value="strict">严格</option>
          </select>
        </div>

        <div>
          <label className="label">预设人数</label>
          <input className="input bg-gray-50" value={`${requiredPlayers} 人`} disabled readOnly />
        </div>

        <div>
          <label className="label">初始生成玩家数</label>
          <input className="input" type="number" min={0} max={requiredPlayers}
                 value={initialPlayers}
                 onChange={e=>setInitialPlayers(e.target.value)} />
        </div>
      </div>

      <button className="btn-primary w-full sm:w-auto" type="submit">创建房间</button>
    </form>
  );
}
