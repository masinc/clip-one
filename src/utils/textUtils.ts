/**
 * テキストを指定された長さで切り詰める
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * コンテンツタイプに応じたアイコンを取得
 */
export function getTypeIcon(type: string): string {
  switch (type) {
    case "url":
      return "🌐";
    default:
      return "📝";
  }
}
