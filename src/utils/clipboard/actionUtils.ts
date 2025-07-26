import { openUrl } from "@tauri-apps/plugin-opener";
import type { GlobalAction } from "@/contexts/ActionsContext";
import type { ClipboardAction } from "@/types/clipboardActions";
import { isUrlContent, mimeToCategory } from "@/utils/contentTypeMapper";
import { getIconComponent } from "@/utils/iconMapping";

/**
 * GlobalActionをClipboardActionに変換する関数
 */
export function convertToClipboardAction(action: GlobalAction): ClipboardAction {
  const IconComponent = getIconComponent(action.icon);

  return {
    id: action.id,
    label: action.label,
    icon: IconComponent,
    priority: action.priority,
    keywords: action.keywords,
    condition: (content: string, type: string) => {
      // Convert MIME type to content category for comparison
      const category = mimeToCategory(type);

      // Check if action allows this content category
      if (action.allowedContentTypes.includes(category)) {
        return true;
      }

      // Enhanced URL detection: check both content pattern and MIME type
      if (action.allowedContentTypes.includes("url") && isUrlContent(content, type)) {
        return true;
      }

      return false;
    },
    execute: async (content: string, _navigate?: (path: string) => void, _itemId?: string) => {
      if (!action.enabled) return;

      switch (action.type) {
        case "url":
          if (action.command) {
            const url = action.command.replace("CONTENT", encodeURIComponent(content));
            await openUrl(url);
          }
          break;
        case "code":
          if (action.command) {
            try {
              // セキュリティ上の理由でeval()を使用せず、安全な処理に限定
              console.warn("Code execution is disabled for security reasons:", action.command);
              // 将来的にサンドボックス環境での実行を検討
            } catch (e) {
              console.error("Code execution error:", e);
            }
          }
          break;
        case "built-in":
          // 組み込みアクションの処理
          switch (action.id) {
            case "copy":
              navigator.clipboard.writeText(content);
              break;
            case "open-url":
              if (/^https?:\/\//.test(content)) {
                await openUrl(content);
              }
              break;
            default:
              console.log("Built-in action:", action.id, content);
          }
          break;
        default:
          console.log("Unknown action type:", action.type);
      }
    },
  };
}

/**
 * アクション検索機能
 */
export function searchActions(actions: ClipboardAction[], query: string): ClipboardAction[] {
  if (!query.trim()) return actions;

  const lowercaseQuery = query.toLowerCase();
  return actions.filter(
    (action) =>
      action.label.toLowerCase().includes(lowercaseQuery) ||
      action.keywords?.some((keyword) => keyword.toLowerCase().includes(lowercaseQuery)),
  );
}
