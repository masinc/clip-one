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
    case "text/html":
      return "🌐";
    case "text/rtf":
      return "📝";
    case "text/uri-list":
      return "🔗";
    case "image/png":
    case "image/jpeg":
    case "image/gif":
      return "🖼️";
    case "application/x-file-list":
      return "📁";
    case "application/x-file-path":
      return "📄";
    case "text/plain":
    default:
      return "📄";
  }
}

/**
 * コンテンツタイプに応じた表示名を取得
 */
export function getTypeName(type: string): string {
  switch (type) {
    case "text/html":
      return "HTML";
    case "text/rtf":
      return "リッチテキスト";
    case "text/uri-list":
      return "URL";
    case "image/png":
    case "image/jpeg":
    case "image/gif":
      return "画像";
    case "application/x-file-list":
      return "ファイルリスト";
    case "application/x-file-path":
      return "ファイルパス";
    case "text/plain":
    default:
      return "テキスト";
  }
}
