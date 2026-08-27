export function formatReturnDday(value?: string) {
  if (!value) return '반납일 확인 중';
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return '반납일 확인 중';
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  const days = Math.round((dueStart - todayStart) / 86_400_000);
  if (days > 0) return `반납 D-${days}`;
  if (days === 0) return '반납 D-Day';
  return `반납 D+${Math.abs(days)}`;
}
