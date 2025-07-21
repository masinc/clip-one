/**
 * 相対時間を日本語形式でフォーマット
 * @param date DateオブジェクトまたはUnixタイムスタンプ（ミリ秒）
 */
export function formatRelativeTime(date: Date | number): string {
  const now = new Date();
  const targetDate = typeof date === "number" ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return "今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  return targetDate.toLocaleDateString();
}
