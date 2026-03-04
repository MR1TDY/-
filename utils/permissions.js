import config from '../config.js';

export function isOwner(userId) {
  return config.ownerId && userId === config.ownerId;
}

export function hasStaffRole(member) {
  if (!member) return false;
  return (config.staffRoleIds || []).some(id => member.roles.cache.has(id));
}

export function isStaff(interaction) {
  return isOwner(interaction.user.id) || hasStaffRole(interaction.member);
}