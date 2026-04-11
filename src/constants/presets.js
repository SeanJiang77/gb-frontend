export const PRESET_PLAYER_COUNTS = {
  "9p-classic": 9,
  "12p-classic": 12,
};

export function getPresetPlayerCount(presetKey) {
  return PRESET_PLAYER_COUNTS[presetKey] ?? 0;
}
