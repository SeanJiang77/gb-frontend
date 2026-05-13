import React, { useEffect, useMemo, useState } from "react";
import { fastNight, getRoom, step } from "../api/rooms";
import useRoomStore from "../store/roomStore";
import { ROLES } from "../constants/roles";

const ROLE_META = {
  [ROLES.WEREWOLF]: { label: "狼人", accent: "bg-red-50 text-red-700 border-red-200" },
  [ROLES.SEER]: { label: "预言家", accent: "bg-blue-50 text-blue-700 border-blue-200" },
  [ROLES.WITCH]: { label: "女巫", accent: "bg-violet-50 text-violet-700 border-violet-200" },
  [ROLES.GUARD]: { label: "守卫", accent: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  [ROLES.VILLAGER]: { label: "平民", accent: "bg-stone-100 text-stone-700 border-stone-200" },
};

const NIGHT_STAGE_CONFIG = [
  {
    key: "guard",
    label: "守卫守护",
    getCompleted: (plan) => plan.guard.completed,
  },
  {
    key: "wolves",
    label: "狼人袭击",
    getCompleted: (plan) => plan.wolves.completed,
  },
  {
    key: "seer",
    label: "预言家查验",
    getCompleted: (plan) => plan.seer.completed,
  },
  {
    key: "witchHeal",
    label: "女巫救人",
    getCompleted: (plan) => plan.witch.healDone,
  },
  {
    key: "witchPoison",
    label: "女巫毒人",
    getCompleted: (plan) => plan.witch.poisonDone,
  },
];

function createEmptyNightPlan() {
  return {
    guard: { targetSeat: null, completed: false },
    wolves: { targetSeat: null, completed: false },
    seer: { targetSeat: null, completed: false },
    witch: { healTargetSeat: null, poisonTargetSeat: null, healDone: false, poisonDone: false },
  };
}

function formatSummary(summary) {
  if (!summary) return "";

  const parts = [];

  if (summary.prevented?.byGuard) parts.push("守卫拦刀");
  if (summary.prevented?.byHeal) parts.push("女巫救人");
  if (summary.extra?.sameProtectAndHeal) parts.push(`同守同救 ${summary.extra.sameProtectAndHeal} 号`);

  const killed = summary.killed?.length ? summary.killed.join("、") : "无";
  const survived = summary.survived?.length ? summary.survived.join("、") : "无";

  return `夜晚结算完成。死亡：${killed}；幸存：${survived}${parts.length ? `；${parts.join("；")}` : ""}`;
}

function formatSeconds(totalSeconds) {
  const total = Number(totalSeconds) || 0;
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function phaseLabel(status) {
  return (
    {
      init: "准备阶段",
      night: "夜晚",
      day: "白天",
      vote: "投票",
      end: "结束",
    }[status] ?? status
  );
}

function parseSeatValue(value) {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getRoleMeta(role) {
  return ROLE_META[role] ?? { label: "未发牌", accent: "bg-gray-100 text-gray-600 border-gray-200" };
}

function nightStageLabel(stage) {
  if (stage === "done") return "夜晚完成";
  return NIGHT_STAGE_CONFIG.find((item) => item.key === stage)?.label ?? stage;
}

function getNightActionButtonClass(active) {
  return active
    ? "btn-primary w-full justify-center rounded-2xl px-3 py-2 text-[13px] font-semibold leading-4 tracking-tight sm:text-sm"
    : "w-full rounded-2xl border border-gray-200 bg-gray-100 px-3 py-2 text-[13px] font-semibold leading-4 tracking-tight text-gray-400 shadow-none cursor-not-allowed sm:text-sm";
}

function getNightStageDuration(stage, isFirstNight) {
  if (stage === "guard") return 10;
  if (stage === "wolves") return isFirstNight ? 75 : 60;
  if (stage === "seer") return 8;
  if (stage === "witchHeal") return 10;
  if (stage === "witchPoison") return 10;
  return 0;
}

function buildHostScript({
  room,
  currentNightStage,
  currentSpeakerSeat,
  wolvesVictimSeat,
  witchHealBlockedBySelfSave,
  isFirstNight,
  currentNightNumber,
  currentSpeakerElapsed,
}) {
  if (!room?._id) return "请先创建房间并进入游戏流程。";

  if (room.status === "night") {
    if (currentNightStage === "guard") {
      return "请守卫睁眼。今夜你要守护的是几号？请用手势示意。";
    }
    if (currentNightStage === "wolves") {
      return "请狼人睁眼。今夜你们要袭击的是几号？请统一手势。";
    }
    if (currentNightStage === "seer") {
      return "请预言家睁眼。你要查验几号？请用手势示意。";
    }
    if (currentNightStage === "witchHeal") {
      if (wolvesVictimSeat == null) {
        return "请女巫睁眼。今夜没有明确的中刀目标，请直接决定是否救人。";
      }
      if (witchHealBlockedBySelfSave) {
        return `请女巫睁眼。今夜死的人是（手指比）${wolvesVictimSeat} 号。首夜不能自救，请直接示意不救。`;
      }
      return `请女巫睁眼。今夜死的人是（手指比）${wolvesVictimSeat} 号。请问你是否要救人？`;
    }
    if (currentNightStage === "witchPoison") {
      return "请女巫继续睁眼。你今夜是否要使用毒药？如要使用，请示意目标座位。";
    }
    if (currentNightStage === "done") {
      return `第 ${currentNightNumber} 夜动作已完成。请所有玩家闭眼，天亮了。`;
    }
    return isFirstNight ? "首夜流程开始，请按顺序主持夜晚动作。" : `第 ${currentNightNumber} 夜开始，请按顺序主持夜晚动作。`;
  }

  if (room.status === "day") {
    if (currentSpeakerSeat != null) {
      return `现在请 ${currentSpeakerSeat} 号玩家发言。当前计时 ${formatSeconds(currentSpeakerElapsed)}。`;
    }
    return "白天讨论开始。请根据规则安排上警、警长发言顺序和白天讨论。";
  }

  if (room.status === "vote") {
    return "进入投票环节。请逐位确认投票对象，并记录投票结果。";
  }

  if (room.status === "end") {
    return "本局游戏已经结束，请复盘并公布结果。";
  }

  return "请继续当前流程。";
}

function findCircularStartSeat(aliveSeats, anchorSeat, direction) {
  if (!aliveSeats.length) return null;
  const sorted = [...aliveSeats].sort((a, b) => a - b);

  if (direction === "left") {
    return [...sorted].reverse().find((seat) => seat < anchorSeat) ?? sorted[sorted.length - 1];
  }

  return sorted.find((seat) => seat > anchorSeat) ?? sorted[0];
}

function buildCircularSpeechOrder(aliveSeats, startSeat, direction) {
  if (!aliveSeats.length || startSeat == null) return [];

  const orderedSeats =
    direction === "left"
      ? [...aliveSeats].sort((a, b) => b - a)
      : [...aliveSeats].sort((a, b) => a - b);

  const startIndex = orderedSeats.indexOf(startSeat);
  if (startIndex === -1) return orderedSeats;

  return [...orderedSeats.slice(startIndex), ...orderedSeats.slice(0, startIndex)];
}

export default function GMPanel() {
  const { room, setRoom } = useRoomStore();

  const [targetSeat, setTargetSeat] = useState("");
  const [voterSeat, setVoterSeat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [summary, setSummary] = useState(null);
  const [nightPlan, setNightPlan] = useState(createEmptyNightPlan);
  const [nightStageRemaining, setNightStageRemaining] = useState(0);
  const [nightStageRunning, setNightStageRunning] = useState(false);
  const [speechOrder, setSpeechOrder] = useState([]);
  const [speechIndex, setSpeechIndex] = useState(0);
  const [speechRunning, setSpeechRunning] = useState(false);
  const [speechElapsed, setSpeechElapsed] = useState(0);
  const [speechLimitSec, setSpeechLimitSec] = useState(180);
  const [speechTotals, setSpeechTotals] = useState({});
  const [sheriffCandidates, setSheriffCandidates] = useState([]);
  const [sheriffSeat, setSheriffSeat] = useState(null);
  const [voteRecords, setVoteRecords] = useState({});
  const [expandedSeats, setExpandedSeats] = useState([]);
  const [sheriffTieRound, setSheriffTieRound] = useState(0);
  const [sheriffTiedSeats, setSheriffTiedSeats] = useState([]);
  const [exileTieRound, setExileTieRound] = useState(0);
  const [exileTiedSeats, setExileTiedSeats] = useState([]);

  if (!room?._id) return <div className="card">请先创建房间</div>;

  const players = room.players ?? [];
  const inNight = room.status === "night";
  const inDay = room.status === "day";
  const inVote = room.status === "vote";
  const inSheriffVote = inDay && sheriffCandidates.length > 0 && sheriffSeat == null;
  const parsedTargetSeat = parseSeatValue(targetSeat);
  const parsedVoterSeat = parseSeatValue(voterSeat);

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => a.seat - b.seat), [players]);
  const alivePlayers = useMemo(() => sortedPlayers.filter((player) => player.alive), [sortedPlayers]);
  const playerBySeat = useMemo(
    () => new Map(sortedPlayers.map((player) => [player.seat, player])),
    [sortedPlayers]
  );

  const sheriffIsDead = sheriffSeat != null && !playerBySeat.get(sheriffSeat)?.alive;

  const midPoint = Math.ceil(sortedPlayers.length / 2);
  const mobilePlayers = sortedPlayers;
  const leftPlayers = sortedPlayers.slice(0, midPoint);
  const rightPlayers = sortedPlayers.slice(midPoint);
  const currentSpeakerSeat = speechOrder[speechIndex] ?? null;
  const lastKilledSeats = Array.isArray(room.meta?.lastKilledSeats)
    ? room.meta.lastKilledSeats
    : Number.isInteger(room.meta?.lastKilledSeat)
    ? [room.meta.lastKilledSeat]
    : [];
  const lastKilledSeat = lastKilledSeats.length ? [...lastKilledSeats].sort((a, b) => a - b)[0] : null;
  const lastKilledLabel = lastKilledSeats.length ? [...lastKilledSeats].sort((a, b) => a - b).join("、") : null;
  const resolvedNightCount = useMemo(
    () => (room.log || []).filter((entry) => entry?.payload?.action === "nightSummary").length,
    [room.log]
  );
  const isFirstNight = resolvedNightCount === 0;
  const currentNightNumber = resolvedNightCount + (inNight ? 1 : 0);
  const voteTally = useMemo(() => {
    const tally = {};
    Object.values(voteRecords).forEach((seat) => {
      tally[seat] = (tally[seat] ?? 0) + 1;
    });
    return Object.entries(tally)
      .map(([seat, count]) => ({ seat: Number(seat), count }))
      .sort((a, b) => b.count - a.count || a.seat - b.seat);
  }, [voteRecords]);

  const seatOf = (role) => sortedPlayers.find((player) => player.role === role)?.seat ?? null;

  const anyWolfSeat = () => sortedPlayers.filter((player) => player.role === ROLES.WEREWOLF)[0]?.seat ?? null;

  const witch = sortedPlayers.find((player) => player.role === ROLES.WITCH);
  const witchSeat = witch?.seat ?? null;
  const seerSeat = seatOf(ROLES.SEER);
  const wolvesVictimSeat = nightPlan.wolves.targetSeat;
  const witchSelfSaveAllowed = !!room.rules?.witchSelfSaveFirstNight;
  const nightStageAvailability = useMemo(
    () => ({
      guard: seatOf(ROLES.GUARD) != null,
      wolves: anyWolfSeat() != null,
      seer: seatOf(ROLES.SEER) != null,
      witchHeal: seatOf(ROLES.WITCH) != null && !witch?._witchHealUsed,
      witchPoison: seatOf(ROLES.WITCH) != null && !witch?._witchPoisonUsed,
    }),
    [sortedPlayers, witch]
  );
  const nightStageItems = useMemo(
    () =>
      NIGHT_STAGE_CONFIG.filter((item) => nightStageAvailability[item.key]).map((item, index) => ({
        ...item,
        completed: item.getCompleted(nightPlan),
        order: index + 1,
      })),
    [nightPlan, nightStageAvailability]
  );
  const currentNightStage = useMemo(() => {
    if (!inNight) return null;

    for (const stage of nightStageItems) {
      if (!stage.completed) return stage.key;
    }

    return "done";
  }, [inNight, nightStageItems]);
  const currentNightStageMeta = useMemo(() => {
    if (!nightStageItems.length) return null;
    if (currentNightStage === "done") return nightStageItems[nightStageItems.length - 1];
    return nightStageItems.find((item) => item.key === currentNightStage) ?? null;
  }, [currentNightStage, nightStageItems]);
  const currentNightStageStatusLine = useMemo(() => {
    if (!currentNightStageMeta) return "夜晚流程未启用";
    const suffix = currentNightStage === "done" ? "（已完成）" : "";
    return `step ${currentNightStageMeta.order}/${nightStageItems.length}：${currentNightStageMeta.label}${suffix}`;
  }, [currentNightStage, currentNightStageMeta, nightStageItems.length]);
  const witchHealBlockedBySelfSave =
    currentNightStage === "witchHeal" &&
    isFirstNight &&
    witchSeat != null &&
    wolvesVictimSeat === witchSeat &&
    !witchSelfSaveAllowed;
  const hostScript = useMemo(
    () =>
      buildHostScript({
        room,
        currentNightStage,
        currentSpeakerSeat,
        wolvesVictimSeat,
        witchHealBlockedBySelfSave,
        isFirstNight,
        currentNightNumber,
        currentSpeakerElapsed: speechElapsed,
      }),
    [
      room,
      currentNightStage,
      currentSpeakerSeat,
      wolvesVictimSeat,
      witchHealBlockedBySelfSave,
      isFirstNight,
      currentNightNumber,
      speechElapsed,
    ]
  );

  const refresh = async () => {
    try {
      setError("");
      setRoom(await getRoom(room._id));
    } catch (e) {
      setError(e.message);
    }
  };

  const hasSeat = (seat) => playerBySeat.has(seat);

  const requireTargetSeat = (actionLabel) => {
    if (parsedTargetSeat == null) {
      setNote(`请选择${actionLabel}目标`);
      return null;
    }
    if (!hasSeat(parsedTargetSeat)) {
      setNote(`座位 ${parsedTargetSeat} 不存在`);
      return null;
    }
    return parsedTargetSeat;
  };

  const requireAliveSeat = (seat, label) => {
    const player = playerBySeat.get(seat);
    if (!player) {
      setNote(`座位 ${seat} 不存在`);
      return null;
    }
    if (!player.alive) {
      setNote(`${label}必须是存活玩家`);
      return null;
    }
    return player;
  };

  const ensureNightStage = (stage) => {
    if (!inNight) {
      setNote("当前不是夜晚阶段");
      return false;
    }
    if (currentNightStage !== stage) {
      setNote(`当前应执行：${nightStageLabel(currentNightStage)}`);
      return false;
    }
    return true;
  };

  useEffect(() => {
    setNightPlan(createEmptyNightPlan());
    setSummary(null);
    setNote("");
    setSpeechOrder([]);
    setSpeechIndex(0);
    setSpeechRunning(false);
    setSpeechElapsed(0);
    setSpeechTotals({});
    setSheriffCandidates([]);
    setSheriffSeat(null);
    setVoteRecords({});
    setVoterSeat("");
    setExpandedSeats([]);
    setSheriffTieRound(0);
    setSheriffTiedSeats([]);
    setExileTieRound(0);
    setExileTiedSeats([]);
  }, [room._id]);

  useEffect(() => {
    if (!inNight) {
      setNightPlan(createEmptyNightPlan());
    }
  }, [inNight]);

  useEffect(() => {
    if (inDay) {
      setVoteRecords({});
      setVoterSeat("");
      setTargetSeat("");
      setSheriffTieRound(0);
      setSheriffTiedSeats([]);
      setExileTieRound(0);
      setExileTiedSeats([]);
    }
  }, [inDay]);

  useEffect(() => {
    if (inNight) {
      setTargetSeat("");
      setExpandedSeats([]);
    }
  }, [inNight]);

  useEffect(() => {
    if (!inNight || currentNightStage == null || currentNightStage === "done") {
      setNightStageRunning(false);
      setNightStageRemaining(0);
      return;
    }

    setNightStageRemaining(getNightStageDuration(currentNightStage, isFirstNight));
    setNightStageRunning(true);
  }, [currentNightStage, inNight, isFirstNight]);

  useEffect(() => {
    if (inDay) {
      setTargetSeat("");
      setExpandedSeats([]);
    }
  }, [inDay]);

  useEffect(() => {
    if (!inDay || parsedTargetSeat == null) return;
    if (sheriffSeat != null) return;
    if (sheriffCandidates.includes(parsedTargetSeat)) return;
    setTargetSeat("");
  }, [inDay, parsedTargetSeat, sheriffCandidates, sheriffSeat]);

  useEffect(() => {
    if (!speechRunning) return undefined;
    const timer = setInterval(() => {
      setSpeechElapsed((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [speechRunning]);

  useEffect(() => {
    if (!inNight || !nightStageRunning || currentNightStage == null || currentNightStage === "done") {
      return undefined;
    }

    const timer = setInterval(() => {
      setNightStageRemaining((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentNightStage, inNight, nightStageRunning]);

  useEffect(() => {
    if (currentSpeakerSeat == null) {
      setSpeechRunning(false);
      setSpeechElapsed(0);
      return;
    }
    setExpandedSeats([currentSpeakerSeat]);
  }, [currentSpeakerSeat]);

  useEffect(() => {
    if (!inNight) return;

    if (currentNightStage === "guard") {
      setNote("请指定守卫今夜要守护的目标。");
      return;
    }
    if (currentNightStage === "wolves") {
      setNote("请指定狼人今夜要袭击的目标。");
      return;
    }
    if (currentNightStage === "seer") {
      setNote("请指定预言家要查验的目标；不能查验自己。");
      return;
    }
    if (currentNightStage === "witchHeal") {
      if (witchHealBlockedBySelfSave) {
        setNote(`今夜死的人是（手指比）${wolvesVictimSeat} 号。首夜不能自救，解药已禁用，请直接决定是否跳过救人。`);
      } else if (wolvesVictimSeat != null) {
        setNote(`今夜死的人是（手指比）${wolvesVictimSeat} 号，请问你是否要救人。`);
      } else {
        setNote("今夜没有明确中刀目标，女巫可直接决定不救。");
      }
      return;
    }
    if (currentNightStage === "witchPoison") {
      setNote("请指定女巫是否使用毒药；若不使用，请点击“女巫不毒”。");
      return;
    }
    if (currentNightStage === "done") {
      setNote("夜晚动作已全部记录，可以结算夜晚。");
    }
  }, [currentNightStage, inNight, seerSeat, witchHealBlockedBySelfSave, wolvesVictimSeat]);

  const explainGuard = (seat) => {
    if (!seat) setNote("请选择守护目标");
    else setNote(`守卫将守护 ${seat} 号`);
  };

  const explainWolf = (seat) => {
    if (!seat) setNote("本夜狼人选择空刀");
    else setNote(`狼人将袭击 ${seat} 号`);
  };

  const explainSeer = (seat) => {
    if (!seat) return setNote("请选择查验目标");
    const target = playerBySeat.get(Number(seat));
    if (!target) return;
    setNote(target.role === ROLES.WEREWOLF ? "查验结果：坏人" : "查验结果：好人");
  };

  const explainWitchHeal = () => {
    if (!witch) setNote("场上无女巫");
    else if (witchHealBlockedBySelfSave)
      setNote(`今夜死的人是（手指比）${wolvesVictimSeat} 号。首夜不能自救，解药已禁用。`);
    else if (nightPlan.wolves.targetSeat != null) {
      setNote(`今夜死的人是（手指比）${nightPlan.wolves.targetSeat} 号，请问你是否要救人。`);
    } else {
      setNote("请先记录狼人袭击目标，再决定是否救人");
    }
  };

  const explainWitchPoison = (seat) => {
    if (!seat) setNote("请选择毒杀目标");
    else setNote(`女巫将毒杀 ${seat} 号`);
  };

  const queueGuard = () => {
    if (!ensureNightStage("guard")) return;
    const seat = requireTargetSeat("守护");
    if (seat == null) return;

    setSummary(null);
    setNightPlan((prev) => ({ ...prev, guard: { targetSeat: seat, completed: true } }));
    setTargetSeat("");
    setNote(`已记录：守卫守护 ${seat} 号`);
  };

  const skipGuard = () => {
    if (!ensureNightStage("guard")) return;

    setSummary(null);
    setNightPlan((prev) => ({ ...prev, guard: { targetSeat: null, completed: true } }));
    setTargetSeat("");
    setNote("已记录：守卫本夜空守");
  };

  const queueWolves = () => {
    if (!ensureNightStage("wolves")) return;
    const seat = requireTargetSeat("袭击");
    if (seat == null) return;

    setSummary(null);
    setNightPlan((prev) => ({
      ...prev,
      wolves: { targetSeat: seat, completed: true },
      witch: {
        ...prev.witch,
        healTargetSeat: null,
      },
    }));
    setTargetSeat("");
    setNote(`已记录：狼人袭击 ${seat} 号`);
  };

  const skipWolves = () => {
    if (!ensureNightStage("wolves")) return;

    setSummary(null);
    setNightPlan((prev) => ({
      ...prev,
      wolves: { targetSeat: null, completed: true },
      witch: {
        ...prev.witch,
        healTargetSeat: null,
      },
    }));
    setTargetSeat("");
    setNote("已记录：狼人本夜空刀");
  };

  const queueSeer = () => {
    if (!ensureNightStage("seer")) return;
    const seat = requireTargetSeat("查验");
    if (seat == null) return;
    if (seerSeat != null && seat === seerSeat) {
      setNote("预言家不能查验自己的身份");
      return;
    }

    setSummary(null);
    setNightPlan((prev) => ({ ...prev, seer: { targetSeat: seat, completed: true } }));
    setTargetSeat("");

    const target = playerBySeat.get(seat);
    setNote(target?.role === ROLES.WEREWOLF ? "已记录：预言家将查到坏人" : "已记录：预言家将查到好人");
  };

  const queueWitchHeal = () => {
    if (!ensureNightStage("witchHeal")) return;
    if (witchHealBlockedBySelfSave) {
      setNote(`今夜死的人是（手指比）${wolvesVictimSeat} 号。首夜不能自救，请直接点击“女巫不救”。`);
      return;
    }
    const wolvesTarget = nightPlan.wolves.targetSeat;
    if (wolvesTarget == null) {
      setNote("请先记录狼人袭击目标，再决定是否救人");
      return;
    }

    setSummary(null);
    setNightPlan((prev) => ({
      ...prev,
      witch: { ...prev.witch, healTargetSeat: wolvesTarget, healDone: true },
    }));
    setNote(`已记录：女巫救起 ${wolvesTarget} 号`);
  };

  const skipWitchHeal = () => {
    if (!ensureNightStage("witchHeal")) return;
    setSummary(null);
    setNightPlan((prev) => ({
      ...prev,
      witch: { ...prev.witch, healTargetSeat: null, healDone: true },
    }));
    setNote("已记录：女巫本夜不救人");
  };

  const queueWitchPoison = () => {
    if (!ensureNightStage("witchPoison")) return;
    const seat = requireTargetSeat("毒杀");
    if (seat == null) return;

    setSummary(null);
    setNightPlan((prev) => ({
      ...prev,
      witch: { ...prev.witch, poisonTargetSeat: seat, poisonDone: true },
    }));
    setTargetSeat("");
    setNote(`已记录：女巫毒杀 ${seat} 号`);
  };

  const skipWitchPoison = () => {
    if (!ensureNightStage("witchPoison")) return;
    setSummary(null);
    setNightPlan((prev) => ({
      ...prev,
      witch: { ...prev.witch, poisonTargetSeat: null, poisonDone: true },
    }));
    setNote("已记录：女巫本夜不使用毒药");
  };

  const clearNightPlan = () => {
    setNightPlan(createEmptyNightPlan());
    setSummary(null);
    setTargetSeat("");
    setNightStageRunning(inNight);
    setNightStageRemaining(currentNightStage && currentNightStage !== "done" ? getNightStageDuration(currentNightStage, isFirstNight) : 0);
    setNote("已清空本夜已记录动作");
  };

  const resetNightStageTimer = () => {
    if (!inNight || currentNightStage == null || currentNightStage === "done") return;
    setNightStageRemaining(getNightStageDuration(currentNightStage, isFirstNight));
    setNightStageRunning(true);
    setNote(`${nightStageLabel(currentNightStage)}计时已重置`);
  };

  const resolveCurrentNight = async () => {
    if (currentNightStage !== "done") {
      setNote(`夜晚流程尚未完成，当前应执行：${nightStageLabel(currentNightStage)}`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...nightPlan,
        witch: { ...nightPlan.witch, isFirstNight },
        advanceToDay: true,
      };

      const { room: updatedRoom, summary: resultSummary } = await fastNight(room._id, payload);
      setRoom(updatedRoom);
      setSummary(resultSummary);
      setNightPlan(createEmptyNightPlan());
      setNote(formatSummary(resultSummary));

      if (updatedRoom.status === "day") {
      }
    } catch (e) {
      setError(e.message);
      setNote(`失败：${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const advance = async () => {
    if (inNight) {
      await resolveCurrentNight();
      return;
    }

    try {
      setLoading(true);
      setError("");
      const updated = await step(room._id, {
        actor: "system",
        action: "advancePhase",
      });
      setRoom(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const removeSpeaker = (seat) => {
    const currentIndex = speechOrder.indexOf(seat);
    setSpeechOrder((prev) => prev.filter((item) => item !== seat));
    setSpeechIndex((prev) => (currentIndex === -1 ? prev : Math.min(prev, Math.max(speechOrder.length - 2, 0))));
    if (currentSpeakerSeat === seat) {
      setSpeechRunning(false);
      setSpeechElapsed(0);
    }
    setNote(`已移出发言顺序：${seat} 号`);
  };

  const buildSpeechOrder = (direction) => {
    const order = [...alivePlayers]
      .sort((a, b) => (direction === "desc" ? b.seat - a.seat : a.seat - b.seat))
      .map((player) => player.seat);
    setSpeechOrder(order);
    setSpeechIndex(0);
    setSpeechRunning(false);
    setSpeechElapsed(0);
    setNote(`已按座位${direction === "desc" ? "降序" : "升序"}生成发言顺序`);
  };

  const applyAutoSpeechRule = (directionOverride = null) => {
    const aliveSeats = alivePlayers.map((player) => player.seat);
    if (!aliveSeats.length) {
      setNote("当前没有存活玩家，无法生成发言顺序");
      return;
    }

    const sheriffAlive = sheriffSeat != null && aliveSeats.includes(sheriffSeat);
    const hasNightDeath = lastKilledSeats.length > 0;

    let anchorSeat = null;
    let direction = "right";
    let ruleLabel = "";

    if (sheriffAlive) {
      direction = directionOverride ?? "right";
      anchorSeat = hasNightDeath ? lastKilledSeat : sheriffSeat;
      ruleLabel = hasNightDeath
        ? `昨夜死亡 ${lastKilledLabel} 号，警长指定从${anchorSeat}号${direction === "left" ? "左侧" : "右侧"}开始发言`
        : `平安夜由警长指定从${sheriffSeat}号${direction === "left" ? "左侧" : "右侧"}开始发言`;
    } else if (hasNightDeath) {
      direction = "right";
      anchorSeat = lastKilledSeat;
      ruleLabel = `昨夜死亡 ${lastKilledLabel} 号，从 ${anchorSeat} 号右侧开始顺序发言`;
    } else {
      direction = "right";
      anchorSeat = 0;
      ruleLabel = "平安夜且无警长，从 1 号位方向顺序发言";
    }

    const startSeat = findCircularStartSeat(aliveSeats, anchorSeat, direction);
    const order = buildCircularSpeechOrder(aliveSeats, startSeat, direction);

    setSpeechOrder(order);
    setSpeechIndex(0);
    setSpeechRunning(false);
    setSpeechElapsed(0);
    setExpandedSeats(order[0] != null ? [order[0]] : []);
    setNote(`${ruleLabel}。顺序：${order.join(" -> ")}`);
  };

  const startSpeechTimer = () => {
    if (currentSpeakerSeat == null) {
      setNote("请先安排发言顺序");
      return;
    }
    setSpeechRunning(true);
    setNote(`开始计时：${currentSpeakerSeat} 号`);
  };

  const pauseSpeechTimer = () => {
    setSpeechRunning(false);
    setNote("发言计时已暂停");
  };

  const finishSpeaker = (moveNext = true) => {
    if (currentSpeakerSeat == null) return;

    const finishedSeat = currentSpeakerSeat;
    const elapsed = speechElapsed;
    const nextIndex = speechIndex + 1;
    const hasNextSpeaker = moveNext && nextIndex < speechOrder.length;

    setSpeechTotals((prev) => ({
      ...prev,
      [finishedSeat]: (prev[finishedSeat] ?? 0) + elapsed,
    }));
    setSpeechRunning(false);
    setSpeechElapsed(0);
    if (hasNextSpeaker) {
      setSpeechIndex(nextIndex);
    } else {
      setSpeechIndex(speechOrder.length);
      setExpandedSeats([]);
    }
    setNote(`已记录 ${finishedSeat} 号发言 ${formatSeconds(elapsed)}`);
  };

  const resetSpeechRound = () => {
    setSpeechOrder([]);
    setSpeechIndex(0);
    setSpeechRunning(false);
    setSpeechElapsed(0);
    setSpeechTotals({});
    setExpandedSeats([]);
    setNote("已清空发言顺序与计时");
  };

  const toggleSheriffCandidate = (seat) => {
    const player = requireAliveSeat(seat, "上警");
    if (!player) return;

    setSheriffCandidates((prev) => {
      if (prev.includes(seat)) {
        return prev.filter((item) => item !== seat);
      }
      return [...prev, seat].sort((a, b) => a - b);
    });
    setNote(`已切换 ${seat} 号的上警状态`);
  };

  const electSheriff = () => {
    const seat = requireTargetSeat("警长");
    if (seat == null) return;
    const player = requireAliveSeat(seat, "警长");
    if (!player) return;
    setSheriffSeat(seat);
    setNote(`已设置 ${seat} 号为警长`);
  };

  const transferSheriffBadge = () => {
    const seat = requireTargetSeat("警徽移交对象");
    if (seat == null) return;
    const player = requireAliveSeat(seat, "警徽移交对象");
    if (!player) return;
    setSheriffSeat(seat);
    setNote(`已将警徽移交给 ${seat} 号`);
  };

  const clearSheriff = () => {
    setSheriffSeat(null);
    setSheriffCandidates([]);
    setTargetSeat("");
    setVoterSeat("");
    setNote("已清空上警与警长记录");
  };

  const recordVote = () => {
    if (parsedVoterSeat == null) {
      setNote("请选择投票人");
      return;
    }
    const voter = requireAliveSeat(parsedVoterSeat, "投票人");
    if (!voter) return;
    const target = requireTargetSeat("投票");
    if (target == null) return;
    const targetPlayer = requireAliveSeat(target, "投票目标");
    if (!targetPlayer) return;
    if (parsedVoterSeat === target) {
      setNote("投票人不能投给自己");
      return;
    }

    setVoteRecords((prev) => ({ ...prev, [parsedVoterSeat]: target }));
    setNote(`已记录：${parsedVoterSeat} 号投给 ${target} 号`);
  };

  const clearVotes = () => {
    setVoteRecords({});
    setNote("已清空投票记录");
  };

  const toggleExpandedSeat = (seat) => {
    setExpandedSeats((prev) => (prev.includes(seat) ? prev.filter((item) => item !== seat) : [...prev, seat]));
  };
  const playerCardPhase = inNight ? "night" : inVote ? "vote" : inSheriffVote ? "sheriffVote" : inDay ? "speech" : "default";

  const handlePlayerCardPrimaryClick = (player) => {
    if (inVote || inSheriffVote) {
      setVoterSeat(player.seat);
      setNote(`已将 ${player.seat} 号设为投票人`);
      return;
    }

    if (inNight && currentNightStage === "witchHeal") {
      setNote("女巫救人阶段不需要手动选目标，系统会自动指向今夜中刀者。");
      return;
    }
    if (inNight && currentNightStage === "seer" && player.seat === seerSeat) {
      setNote("预言家不能查验自己的身份");
      return;
    }

    setTargetSeat(player.seat);

    if (!inNight) {
      toggleExpandedSeat(player.seat);
    }
  };

  const setVoteTarget = (seat) => {
    setTargetSeat(seat);
    setNote(`已将 ${seat} 号设为投票目标`);
  };

  const setSheriffVoteTarget = (seat) => {
    setTargetSeat(seat);
    setNote(`已将 ${seat} 号设为上警投票目标`);
  };

  const resolveSheriffElectionTie = () => {
    const tally = voteTally;
    if (tally.length === 0) return;

    const maxVotes = tally[0].count;
    const tiedSeats = tally.filter((t) => t.count === maxVotes).map((t) => t.seat);

    if (tiedSeats.length === 1) {
      // No tie, set as sheriff
      setSheriffSeat(tiedSeats[0]);
      setVoteRecords({});
      setNote(`警长已产生：${tiedSeats[0]} 号`);
      return;
    }

    // Tie detected
    if (sheriffTieRound === 0) {
      // First tie round
      setSheriffTieRound(1);
      setSheriffTiedSeats(tiedSeats);
      setSheriffCandidates(tiedSeats);
      setVoteRecords({});
      setNote(`产生平票！${tiedSeats.join("、")} 号需进行第二轮投票。`);
    } else if (sheriffTieRound === 1) {
      // Second round
      if (tiedSeats.length === 1) {
        setSheriffSeat(tiedSeats[0]);
        setSheriffTieRound(0);
        setSheriffTiedSeats([]);
        setVoteRecords({});
        setNote(`警长已产生：${tiedSeats[0]} 号`);
      } else {
        // Still tied in round 2, no sheriff
        setSheriffSeat(null);
        setSheriffTieRound(0);
        setSheriffTiedSeats([]);
        setSheriffCandidates([]);
        setVoteRecords({});
        setNote("第二轮投票仍平票，本局无警长");
      }
    }
  };

  const resolveExileVoteTie = async () => {
    const tally = voteTally;
    if (tally.length === 0) return;

    const maxVotes = tally[0].count;
    const tiedSeats = tally.filter((t) => t.count === maxVotes).map((t) => t.seat);

    if (tiedSeats.length === 1) {
      // No tie, exile the player
      try {
        setLoading(true);
        const result = await step(room._id, {
          actor: "system",
          action: "exile",
          targetSeat: tiedSeats[0],
        });
        setRoom(result);
        setVoteRecords({});
        setExileTieRound(0);
        setExileTiedSeats([]);
        setNote(`${tiedSeats[0]} 号被放逐`);
        setError("");
      } catch (e) {
        setError(e.message || "放逐失败");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Tie detected
    if (exileTieRound === 0) {
      // First tie round
      setExileTieRound(1);
      setExileTiedSeats(tiedSeats);
      // Update speech order to only show tied players
      setSpeechOrder(tiedSeats);
      setSpeechIndex(0);
      setVoteRecords({});
      setNote(`产生平票！${tiedSeats.join("、")} 号需重新发言，其他玩家重新投票。`);
    } else if (exileTieRound === 1) {
      // Second round
      if (tiedSeats.length === 1) {
        // Resolved to single player - call backend to exile
        try {
          setLoading(true);
          const result = await step(room._id, {
            actor: "system",
            action: "exile",
            targetSeat: tiedSeats[0],
          });
          setRoom(result);
          setExileTieRound(0);
          setExileTiedSeats([]);
          setVoteRecords({});
          setNote(`${tiedSeats[0]} 号被放逐`);
          setError("");
        } catch (e) {
          setError(e.message || "放逐失败");
        } finally {
          setLoading(false);
        }
      } else {
        // Still tied in round 2, nobody exiled
        setExileTieRound(0);
        setExileTiedSeats([]);
        setVoteRecords({});
        setNote("第二轮投票仍平票，本轮无人被放逐，游戏进入夜晚");
      }
    }
  };

  const renderPlayerMetaStrip = (player, isSheriffCandidate) => (
    <div className="rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600">
      当前阶段：{phaseLabel(room.status)}
      {sheriffSeat === player.seat && " · 警长"}
      {isSheriffCandidate && " · 上警"}
    </div>
  );

  const renderNightPlayerActions = (player, isCurrentTarget) => {
    const blockedByHealStage = currentNightStage === "witchHeal";
    const blockedBySeerSelf = currentNightStage === "seer" && player.seat === seerSeat;
    const disabled = blockedByHealStage || blockedBySeerSelf;
    const label = blockedByHealStage
      ? "自动目标"
      : blockedBySeerSelf
      ? "不可查验"
      : isCurrentTarget
      ? "当前目标"
      : "设为目标";

    return (
      <div className="mt-2">
        <button
          type="button"
          className={`${isCurrentTarget && !disabled ? "btn-primary" : "btn-secondary"} min-h-8 w-full justify-center rounded-xl px-2 py-1.5 text-[11px] sm:text-xs`}
          onClick={() => handlePlayerCardPrimaryClick(player)}
          disabled={disabled}
        >
          {label}
        </button>
      </div>
    );
  };

  const renderSpeechPlayerActions = (player, isExpanded, isSheriffCandidate) => (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <button
        className={`${isSheriffCandidate ? "btn-primary" : "btn-secondary"} w-full sm:w-auto`}
        onClick={() => toggleSheriffCandidate(player.seat)}
        disabled={!player.alive}
      >
        {isSheriffCandidate ? "取消上警" : "加入上警"}
      </button>
      <button className="btn-secondary w-full sm:w-auto" onClick={() => toggleExpandedSeat(player.seat)}>
        {isExpanded ? "收起" : "展开"}
      </button>
    </div>
  );

  const renderVoteContextActions = (player, isExpanded, extraActions = null) => (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {extraActions}
      <button className="btn-secondary w-full sm:w-auto" onClick={() => toggleExpandedSeat(player.seat)}>
        {isExpanded ? "收起" : "展开"}
      </button>
    </div>
  );

  const renderVotePlayerActions = (player, isExpanded) => renderVoteContextActions(player, isExpanded);

  const renderSheriffVotePlayerActions = (player, isExpanded, isSheriffCandidate) =>
    renderVoteContextActions(
      player,
      isExpanded,
      <button
        className={`${isSheriffCandidate ? "btn-primary" : "btn-secondary"} w-full sm:w-auto`}
        onClick={() => toggleSheriffCandidate(player.seat)}
        disabled={!player.alive}
      >
        {isSheriffCandidate ? "取消上警" : "加入上警"}
      </button>
    );

  const renderPlayerCard = (player) => {
    const roleMeta = getRoleMeta(player.role);
    const isSheriffCandidate = sheriffCandidates.includes(player.seat);
    const isCurrentTarget = parsedTargetSeat === player.seat;
    const isCurrentVoter = parsedVoterSeat === player.seat;
    const isExpanded = playerCardPhase !== "night" && (expandedSeats.includes(player.seat) || currentSpeakerSeat === player.seat);
    const shouldShowExpandedActions = playerCardPhase === "speech" || playerCardPhase === "vote" || playerCardPhase === "sheriffVote";
    const voterSelectionActive = inVote || inSheriffVote;

    return (
      <div
        key={player.seat}
        className={`rounded-2xl border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition xl:rounded-[28px] ${
          isCurrentVoter && voterSelectionActive
            ? "border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-200"
            : player.alive
            ? "border-gray-200"
            : "border-red-200 bg-red-50/60"
        } ${
          isExpanded ? "col-span-full space-y-2 p-3 sm:p-4 xl:p-4" : "p-2 sm:p-3 xl:p-4"
        }`}
      >
        <div className={`flex flex-col gap-2 xl:flex-row xl:gap-3 ${isExpanded ? "xl:items-start xl:justify-between" : "xl:items-start xl:justify-between"}`}>
          <div
            role="button"
            tabIndex={0}
            className={`flex min-w-0 flex-1 gap-2 text-left sm:gap-3 cursor-pointer ${isExpanded ? "items-start" : "items-start py-0.5"}`}
            onClick={() => handlePlayerCardPrimaryClick(player)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePlayerCardPrimaryClick(player);
              }
            }}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 sm:h-8 sm:w-8 sm:text-sm xl:h-9 xl:w-9">
              {player.seat}
            </div>
            <div className="min-w-0 flex-1">
              <div className="space-y-1">
                <div className="break-words text-[12px] font-semibold leading-4 text-gray-900 sm:text-[13px] xl:text-sm xl:leading-5">
                  {player.nickname}
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-[11px] ${roleMeta.accent}`}>
                    {roleMeta.label}
                  </span>
                  <span
                    className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-[11px] ${
                      player.alive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    {player.alive ? "存活" : "出局"}
                  </span>
                  {sheriffSeat === player.seat && (
                    <span className="badge border-yellow-300 bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 sm:px-2 sm:text-[11px]">
                      警长
                    </span>
                  )}
                  {currentSpeakerSeat === player.seat && (
                    <span className="badge border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700 sm:px-2 sm:text-[11px]">
                      发言中
                    </span>
                  )}
                </div>
                {isCurrentTarget && (
                  <div className="text-[10px] font-medium text-emerald-700 sm:text-xs">当前选中</div>
                )}
                {isCurrentVoter && voterSelectionActive && (
                  <div className="text-[10px] font-medium text-emerald-700 sm:text-xs">当前投票人</div>
                )}
              </div>
              {playerCardPhase === "night" && renderNightPlayerActions(player, isCurrentTarget)}
            </div>
          </div>

        </div>

        {playerCardPhase === "speech" && renderSpeechPlayerActions(player, isExpanded, isSheriffCandidate)}
        {playerCardPhase === "vote" && renderVotePlayerActions(player, isExpanded)}
        {playerCardPhase === "sheriffVote" && renderSheriffVotePlayerActions(player, isExpanded, isSheriffCandidate)}

        {isExpanded && shouldShowExpandedActions && (
          renderPlayerMetaStrip(player, isSheriffCandidate)
        )}
      </div>
    );
  };

  const renderNightPanel = () => (
    <div className="space-y-4">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-2 sm:gap-3">
        <button
          className={getNightActionButtonClass(currentNightStage === "guard")}
          onMouseEnter={() => explainGuard(parsedTargetSeat)}
          onClick={queueGuard}
          disabled={loading || currentNightStage !== "guard"}
        >
          守卫守护
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "guard")}
          onClick={skipGuard}
          disabled={loading || currentNightStage !== "guard"}
        >
          守卫空守
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "wolves")}
          onMouseEnter={() => explainWolf(parsedTargetSeat)}
          onClick={queueWolves}
          disabled={loading || currentNightStage !== "wolves"}
        >
          狼人袭击
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "wolves")}
          onClick={skipWolves}
          disabled={loading || currentNightStage !== "wolves"}
        >
          狼人空刀
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "seer")}
          onMouseEnter={() => explainSeer(parsedTargetSeat)}
          onClick={queueSeer}
          disabled={loading || currentNightStage !== "seer"}
        >
          预言家查验
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "witchHeal" && !witchHealBlockedBySelfSave)}
          onMouseEnter={explainWitchHeal}
          onClick={queueWitchHeal}
          disabled={loading || currentNightStage !== "witchHeal" || witchHealBlockedBySelfSave}
        >
          女巫救人
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "witchHeal")}
          onClick={skipWitchHeal}
          disabled={loading || currentNightStage !== "witchHeal"}
        >
          女巫不救
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "witchPoison")}
          onMouseEnter={() => explainWitchPoison(parsedTargetSeat)}
          onClick={queueWitchPoison}
          disabled={loading || currentNightStage !== "witchPoison"}
        >
          女巫毒人
        </button>
        <button
          className={getNightActionButtonClass(currentNightStage === "witchPoison")}
          onClick={skipWitchPoison}
          disabled={loading || currentNightStage !== "witchPoison"}
        >
          女巫不毒
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-gray-700">夜晚计时</div>
              <div className="mt-1 text-3xl font-semibold text-gray-900">{formatSeconds(nightStageRemaining)}</div>
              <div className="mt-1 text-xs text-gray-500">
                {currentNightStage && currentNightStage !== "done"
                  ? `${currentNightStageMeta?.label ?? nightStageLabel(currentNightStage)}默认 ${getNightStageDuration(currentNightStage, isFirstNight)} 秒`
                  : "夜晚流程结束"}
              </div>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                nightStageRunning ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {nightStageRunning ? "计时中" : "已暂停"}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              className="btn-secondary w-full sm:w-auto"
              onClick={() => setNightStageRunning((running) => !running)}
              disabled={!inNight || currentNightStage == null || currentNightStage === "done"}
            >
              {nightStageRunning ? "暂停计时" : "继续计时"}
            </button>
            <button
              className="btn-secondary w-full sm:w-auto"
              onClick={resetNightStageTimer}
              disabled={!inNight || currentNightStage == null || currentNightStage === "done"}
            >
              重置本步计时
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 text-sm font-medium text-gray-700">本夜已记录</div>
          <div className="space-y-2 text-sm text-gray-600">
            <div>守卫：{nightPlan.guard.completed ? nightPlan.guard.targetSeat ? `${nightPlan.guard.targetSeat} 号` : "空守" : "未执行"}</div>
            <div>狼人：{nightPlan.wolves.completed ? nightPlan.wolves.targetSeat ? `${nightPlan.wolves.targetSeat} 号` : "空刀" : "未执行"}</div>
            <div>预言家：{nightPlan.seer.completed ? `${nightPlan.seer.targetSeat} 号` : "未执行"}</div>
            <div>女巫救：{nightPlan.witch.healDone ? nightPlan.witch.healTargetSeat ? `${nightPlan.witch.healTargetSeat} 号` : "不救" : "未执行"}</div>
            <div>女巫毒：{nightPlan.witch.poisonDone ? nightPlan.witch.poisonTargetSeat ? `${nightPlan.witch.poisonTargetSeat} 号` : "不毒" : "未执行"}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSheriffAreaPanel = () => {
    // State 1: Sheriff dead - show badge transfer UI
    if (sheriffIsDead) {
      const currentSheriffseat = sheriffSeat;
      return (
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">警徽移交</div>
            <button className="btn-secondary text-xs" onClick={clearSheriff}>
              清空
            </button>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            警长 {currentSheriffseat} 号已出局，请选择移交对象
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="label">当前移交对象</div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                {parsedTargetSeat ?? "未选择"}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-3">
            <div className="mb-3 text-sm font-medium text-gray-700">选择移交对象</div>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {sortedPlayers.map((player) => {
                if (!player.alive || player.seat === currentSheriffseat) return null;
                const selected = parsedTargetSeat === player.seat;
                return (
                  <button
                    key={player.seat}
                    type="button"
                    className={`flex h-11 w-11 items-center justify-center justify-self-center rounded-full border text-sm font-semibold transition sm:h-12 sm:w-12 ${
                      selected
                        ? "border-yellow-300 bg-yellow-400 text-white shadow-sm"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                    onClick={() => setVoteTarget(player.seat)}
                    title={player.nickname}
                  >
                    {player.seat}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              选择一名存活的玩家作为新警长
            </div>
          </div>
          <button className="btn-primary" onClick={transferSheriffBadge}>
            确认移交警徽
          </button>
        </div>
      );
    }

    // State 2: Sheriff confirmed and alive - greyed out display
    if (sheriffSeat != null) {
      const currentSheriffseat = sheriffSeat;
      const sheriffPlayer = playerBySeat.get(currentSheriffseat);
      return (
        <div className="space-y-3 rounded-2xl border border-gray-300 bg-gray-100 p-4 opacity-60">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">上警与警长</div>
            <span className="text-xs font-medium text-gray-600">(已确定)</span>
          </div>
          <div className="text-sm text-gray-600">
            当前警长：{sheriffPlayer?.nickname ?? `${currentSheriffseat} 号`}
          </div>
          <div className="rounded-xl border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            警长已确定，选举流程已结束
          </div>
        </div>
      );
    }

    // State 3: No sheriff - active sheriff election UI (default behavior)
    return (
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">上警与警长</div>
          <button className="btn-secondary" onClick={clearSheriff}>
            清空
          </button>
        </div>
        <div className="text-sm text-gray-600">
          上警候选：{sheriffCandidates.length ? sheriffCandidates.join("、") : "暂无"}
        </div>
        <div className="text-sm text-gray-600">当前警长：{sheriffSeat ?? "未设置"}</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="label">当前投票人</div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {parsedVoterSeat ?? "未选择"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="label">当前投票目标</div>
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {parsedTargetSeat ?? "未选择"}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-3">
          <div className="mb-3 text-sm font-medium text-gray-700">上警投票目标</div>
          {sheriffCandidates.length === 0 ? (
            <div className="text-sm text-gray-500">暂无上警玩家，先从玩家卡切换上警状态。</div>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {[...sheriffCandidates].sort((a, b) => a - b).map((seat) => {
                const player = playerBySeat.get(seat);
                const selected = parsedTargetSeat === seat;
                const disabled = !player?.alive;
                return (
                  <button
                    key={seat}
                    type="button"
                    className={`flex h-11 w-11 items-center justify-center justify-self-center rounded-full border text-sm font-semibold transition sm:h-12 sm:w-12 ${
                      selected
                        ? "border-red-300 bg-red-500 text-white shadow-sm"
                        : disabled
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    }`}
                    onClick={() => !disabled && setSheriffVoteTarget(seat)}
                    disabled={disabled}
                    title={player?.nickname ?? `${seat}号`}
                  >
                    {seat}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button className="btn-primary" onClick={electSheriff}>
          将当前目标设为警长
        </button>
      </div>
    );
  };

  const renderDayPanel = () => (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        {renderSheriffAreaPanel()}

        <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">发言顺序</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600">
            {sheriffSeat != null
              ? lastKilledSeats.length > 0
                ? `昨夜死亡 ${lastKilledLabel} 号，由警长决定从参考死者 ${lastKilledSeat} 号左侧或右侧开始。`
                : `平安夜，由警长决定从警长 ${sheriffSeat} 号左侧或右侧开始。`
              : lastKilledSeats.length > 0
              ? `昨夜死亡 ${lastKilledLabel} 号，默认从参考死者 ${lastKilledSeat} 号右侧开始。`
              : "平安夜且无警长，默认从 1 号位方向顺序开始。"}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {sheriffSeat != null ? (
              <>
                <button className="btn-primary w-full sm:w-auto" onClick={() => applyAutoSpeechRule("left")}>
                  警长定左
                </button>
                <button className="btn-primary w-full sm:w-auto" onClick={() => applyAutoSpeechRule("right")}>
                  警长定右
                </button>
              </>
            ) : (
              <button className="btn-primary w-full sm:w-auto" onClick={() => applyAutoSpeechRule()}>
                按默认规则生成
              </button>
            )}
            <button className="btn-secondary w-full sm:w-auto" onClick={() => buildSpeechOrder("asc")}>
              手动升序
            </button>
            <button className="btn-secondary w-full sm:w-auto" onClick={() => buildSpeechOrder("desc")}>
              手动降序
            </button>
          </div>
          <div className="text-sm text-gray-600">顺序：{speechOrder.length ? speechOrder.join(" -> ") : "暂未安排"}</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {currentSpeakerSeat != null && (
              <button className="btn-secondary w-full sm:w-auto" onClick={() => removeSpeaker(currentSpeakerSeat)}>
                移除当前发言人
              </button>
            )}
            <button className="btn-secondary w-full sm:w-auto" onClick={resetSpeechRound}>
              重置本轮
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-gray-500">当前发言</div>
            <div className="text-2xl font-semibold text-gray-900">{currentSpeakerSeat == null ? "未开始" : `${currentSpeakerSeat} 号`}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">本轮计时 / 限时</div>
            <div className="text-2xl font-semibold text-gray-900">
              {formatSeconds(speechElapsed)} / {formatSeconds(speechLimitSec)}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[180px_1fr]">
          <label className="space-y-1">
            <div className="label">限时（秒）</div>
            <input
              className="input"
              type="number"
              min={30}
              step={30}
              value={speechLimitSec}
              onChange={(e) => setSpeechLimitSec(Number(e.target.value) || 180)}
            />
          </label>
          <div className="flex flex-col gap-2 self-end sm:flex-row sm:flex-wrap">
            <button className="btn-primary w-full sm:w-auto" onClick={startSpeechTimer} disabled={speechRunning || currentSpeakerSeat == null}>
              开始计时
            </button>
            <button className="btn-secondary w-full sm:w-auto" onClick={pauseSpeechTimer} disabled={!speechRunning}>
              暂停
            </button>
            <button className="btn-secondary w-full sm:w-auto" onClick={() => finishSpeaker(true)} disabled={currentSpeakerSeat == null}>
              结束并下一位
            </button>
            <button className="btn-secondary w-full sm:w-auto" onClick={() => finishSpeaker(false)} disabled={currentSpeakerSeat == null}>
              结束不切换
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderVotePanel = () => (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(160px,180px)_minmax(160px,180px)_1fr]">
        <div className="space-y-1">
          <div className="label">当前投票人</div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            {parsedVoterSeat ?? "未选择"}
          </div>
        </div>
        <div className="space-y-1">
          <div className="label">当前投票目标</div>
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {parsedTargetSeat ?? "未选择"}
          </div>
        </div>
        <div className="flex flex-col gap-2 self-end sm:flex-row sm:flex-wrap">
          <button className="btn-primary w-full sm:w-auto" onClick={recordVote}>
            记录投票
          </button>
          <button className="btn-secondary w-full sm:w-auto" onClick={clearVotes}>
            清空投票
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <div className="mb-3 text-sm font-medium text-gray-700">投票目标选择</div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {sortedPlayers.map((player) => {
            const selected = parsedTargetSeat === player.seat;
            return (
              <button
                key={player.seat}
                type="button"
                className={`flex h-11 w-11 items-center justify-center justify-self-center rounded-full border text-sm font-semibold transition sm:h-12 sm:w-12 ${
                  selected
                    ? "border-red-300 bg-red-500 text-white shadow-sm"
                    : player.alive
                    ? "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                    : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                onClick={() => player.alive && setVoteTarget(player.seat)}
                disabled={!player.alive}
                title={player.nickname}
              >
                {player.seat}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 text-sm font-medium text-gray-700">投票明细</div>
          <div className="space-y-2 text-sm text-gray-600">
            {Object.keys(voteRecords).length === 0 && <div>暂无投票记录</div>}
            {Object.entries(voteRecords)
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(([seat, target]) => (
                <div key={seat}>
                  {seat} 号 {"->"} {target} 号
                </div>
              ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-3 text-sm font-medium text-gray-700">得票统计</div>
          <div className="space-y-2 text-sm text-gray-600">
            {voteTally.length === 0 && <div>暂无统计</div>}
            {voteTally.map((item) => (
              <div key={item.seat}>
                {item.seat} 号：{item.count} 票
              </div>
            ))}
          </div>
          {(inSheriffVote || inVote) && voteTally.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              {inSheriffVote && (
                <button className="btn-primary w-full text-sm" onClick={resolveSheriffElectionTie}>
                  {sheriffTieRound === 1 ? "结束第二轮投票" : "确认上警结果"}
                </button>
              )}
              {inVote && (
                <button className="btn-primary w-full text-sm" onClick={resolveExileVoteTie}>
                  {exileTieRound === 1 ? "结束第二轮投票" : "确认放逐结果"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 xl:grid xl:grid-cols-[minmax(280px,1.08fr)_minmax(520px,1.34fr)_minmax(280px,1.08fr)] xl:gap-4 xl:space-y-0 2xl:grid-cols-[minmax(300px,1.12fr)_minmax(580px,1.4fr)_minmax(300px,1.12fr)]">
      <div className="order-2 xl:hidden">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">玩家列表</h3>
          <div className="text-xs text-gray-400">按座位顺序</div>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">{mobilePlayers.map(renderPlayerCard)}</div>
      </div>

      <div className="hidden xl:block xl:order-1 xl:space-y-4">{leftPlayers.map(renderPlayerCard)}</div>

      <div className="card order-1 space-y-5 xl:order-2">
        <div className="panel-divider flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="page-title text-2xl">主持面板</h2>
            <div className="mt-1 text-sm text-slate-500">
              当前阶段：{phaseLabel(room.status)} | 存活 {alivePlayers.length} / {sortedPlayers.length}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-row lg:flex-wrap lg:items-center">
            <div className="stat-tile py-2">
              当前目标：{parsedTargetSeat ?? "未选择"}
            </div>
            {inNight && (
              <>
                <div className="stat-tile py-2 sm:min-w-[220px]">
                  {currentNightStageStatusLine}
                </div>
                <div className="stat-tile py-2">
                  {isFirstNight ? "首夜" : `第 ${currentNightNumber} 夜`}
                </div>
              </>
            )}
          </div>
        </div>

        {inNight && renderNightPanel()}
        {inDay && renderDayPanel()}
        {inVote && renderVotePanel()}
        {!inNight && !inDay && !inVote && (
          <div className="info-box--muted">
            当前阶段没有专用主持工具，可以直接刷新或推进阶段。
          </div>
        )}

        <div
          className={`info-box ${
            inNight ? "border-amber-200 bg-amber-50 text-amber-950" : "border-blue-200 bg-blue-50 text-blue-950"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">主持脚本</div>
          <div className="mt-2 text-lg font-semibold leading-7">{hostScript}</div>
        </div>

        <div
          className={`info-box ${
            error ? "border-red-200 bg-red-50 text-red-700" : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          <div className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">主持提示</div>
          <div className="mt-2 text-sm leading-6">{error || note || "等待主持操作。"}</div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
          <div className="info-box--muted space-y-2">
            <div className="font-medium text-slate-900">当前信息</div>
            {summary && (
              <div className="text-slate-600">
                最近结算：死亡 {summary.killed?.length ? summary.killed.join("、") : "无"}；幸存 {summary.survived?.length ? summary.survived.join("、") : "无"}
              </div>
            )}
            {currentSpeakerSeat != null && (
              <div className={speechElapsed > speechLimitSec ? "text-red-600" : "text-slate-600"}>
                当前发言人：{currentSpeakerSeat} 号，已计时 {formatSeconds(speechElapsed)}
              </div>
            )}
            {!summary && currentSpeakerSeat == null && <div className="text-slate-500">从左右玩家卡选择目标，或在中央面板继续记录流程。</div>}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
            <button className="btn-secondary w-full sm:w-auto" onClick={refresh} disabled={loading}>
              刷新
            </button>
            {inNight && (
              <button className="btn-secondary w-full sm:w-auto" onClick={clearNightPlan} disabled={loading}>
                清空本夜动作
              </button>
            )}
            <button className="btn-primary w-full sm:w-auto" onClick={advance} disabled={loading}>
              {inNight ? "结算夜晚" : "推进阶段"}
            </button>
          </div>
        </div>

      </div>

      <div className="hidden xl:block xl:order-3 xl:space-y-4">{rightPlayers.map(renderPlayerCard)}</div>
    </div>
  );
}
