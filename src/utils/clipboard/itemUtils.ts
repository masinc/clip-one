import type { ClipboardItem } from "@/types/clipboard";
import type { DisplayClipboardItem } from "@/types/clipboardActions";

/**
 * ClipboardItemを表示用に変換
 */
export function convertClipboardItem(item: ClipboardItem): DisplayClipboardItem {
  // content_typeを正規化（text/plain → text, image/png → image など）
  const normalizeType = (contentType: string) => {
    if (contentType.startsWith("text/")) return "text";
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("application/")) return "files";
    return contentType.split("/")[0] || "text";
  };

  return {
    id: item.id,
    content: item.content,
    type: normalizeType(item.content_type || "text/plain"),
    timestamp: new Date(item.timestamp),
    app: item.source_app || "Unknown",
  };
}
