import React from "react";

export default function PlayerCard({
  player,
  roleMeta,
  isExpanded,
  isHighlighted,
  isCurrentTarget,
  isCurrentVoter,
  voterSelectionActive,
  isSheriff,
  isCurrentSpeaker,
  onPrimaryClick,
  actions,
  expandedContent,
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPrimaryClick?.();
    }
  };

  return (
    <div
      className={`rounded-2xl border bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition xl:rounded-[28px] ${
        isHighlighted
          ? "border-emerald-300 bg-emerald-50/80 ring-1 ring-emerald-200"
          : player.alive
          ? "border-gray-200"
          : "border-red-200 bg-red-50/60"
      } ${isExpanded ? "col-span-full space-y-2 p-3 sm:p-4 xl:p-4" : "p-2 sm:p-3 xl:p-4"}`}
    >
      <div className="flex flex-col gap-2 xl:flex-row xl:items-start xl:justify-between xl:gap-3">
        <div
          role="button"
          tabIndex={0}
          className={`flex min-w-0 flex-1 cursor-pointer gap-2 text-left sm:gap-3 ${
            isExpanded ? "items-start" : "items-start py-0.5"
          }`}
          onClick={onPrimaryClick}
          onKeyDown={handleKeyDown}
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
                {isSheriff && (
                  <span className="badge border-yellow-300 bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 sm:px-2 sm:text-[11px]">
                    警长
                  </span>
                )}
                {isCurrentSpeaker && (
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
          </div>
        </div>
      </div>

      {actions && (
        <div onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
          {actions}
        </div>
      )}

      {expandedContent}
    </div>
  );
}
