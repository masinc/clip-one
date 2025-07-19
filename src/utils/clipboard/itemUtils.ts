import type { ClipboardItem } from "@/types/clipboard";
import type { DisplayClipboardItem } from "@/types/clipboardActions";

/**
 * ClipboardItemを表示用に変換
 */
export function convertClipboardItem(item: ClipboardItem): DisplayClipboardItem {
  return {
    id: item.id,
    content: item.content,
    type: item.content_type || "text",
    timestamp: new Date(item.timestamp),
    app: item.source_app || "Unknown",
  };
}