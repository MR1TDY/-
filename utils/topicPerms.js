import { parseIds } from './roleList.js';
import { getSettings } from '../services/settingsService.js';

export async function isJudgeMember(member) {
  const s = await getSettings();
  const ids = parseIds(s.judgeRoleId); // نفس الحقل لكن فيه أكثر من ID
  return ids.some(id => member.roles.cache.has(id));
}

export async function isDebaterMember(member) {
  const s = await getSettings();
  const ids = parseIds(s.debaterRoleId);
  return ids.some(id => member.roles.cache.has(id));
}