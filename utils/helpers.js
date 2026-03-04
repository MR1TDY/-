export function canEditMonthly(lastDate) {
  if (!lastDate) return true;
  const now = new Date();
  const nextAllowed = new Date(lastDate);
  nextAllowed.setMonth(nextAllowed.getMonth() + 1);
  return now >= nextAllowed;
}

export function timeUntilMonthly(lastDate) {
  const nextAllowed = new Date(lastDate);
  nextAllowed.setMonth(nextAllowed.getMonth() + 1);
  const diff = nextAllowed - new Date();
  if (diff <= 0) return '0d';
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days}d`;
}
