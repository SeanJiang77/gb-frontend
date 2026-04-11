import api from "./client";

/**
 * 创建房间
 */
export async function createRoom(payload) {
  const { data } = await api.post("/rooms", payload);
  return data;
}

/**
 * 获取房间
 */
export async function getRoom(id) {
  const { data } = await api.get(`/rooms/${id}`);
  return data;
}

/**
 * 添加玩家
 */
export async function addPlayer(id, payload) {
  const { data } = await api.post(`/rooms/${id}/players`, payload);
  return data;
}

/**
 * 分配角色
 */
export async function assignRoles(id, payload = {}) {
  const { data } = await api.post(`/rooms/${id}/assign`, payload);
  return data;
}

/**
 * 推进游戏 / 执行动作
 */
export async function step(id, payload) {
  const { data } = await api.post(`/rooms/${id}/step`, payload);
  return data;
}

/**
 * 撤销最后一步
 */
export async function undo(id, payload = {}) {
  const { data } = await api.post(`/rooms/${id}/undo`, payload);
  return data;
}

/**
 * 夜晚快速结算
 */
export async function fastNight(id, payload = {}) {
  const { data } = await api.post(`/rooms/${id}/night/resolve`, payload);
  return data;
}
