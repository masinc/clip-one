import type { ClipboardItem } from "@/types/clipboard";
import type { DisplayClipboardItem } from "@/types/clipboardActions";

/**
 * ClipboardItemを表示用に変換
 */
export function convertClipboardItem(item: ClipboardItem): DisplayClipboardItem {
  // content_typeを正規化（具体的な形式を保持）
  const normalizeType = (contentType: string) => {
    // 具体的な形式はそのまま保持
    switch (contentType) {
      case "text/uri-list":
        return "text/uri-list";
      case "text/html":
        return "text/html";
      case "text/rtf":
        return "text/rtf";
      case "image/png":
      case "image/jpeg":
      case "image/gif":
        return contentType;
      case "application/x-file-list":
        return "application/x-file-list";
      case "application/x-file-path":
        return "application/x-file-path";
      case "text/plain":
      default:
        return "text/plain";
    }
  };

  return {
    id: item.id,
    content: item.content,
    type: normalizeType(item.content_type || "text/plain"),
    timestamp: new Date(item.timestamp),
    app: item.source_app || "Unknown",
  };
}
