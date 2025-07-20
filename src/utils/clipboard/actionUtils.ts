import type { GlobalAction } from "@/contexts/ActionsContext";
import type { ClipboardAction } from "@/types/clipboardActions";
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
      return (
        action.allowedContentTypes.includes(type) ||
        (action.allowedContentTypes.includes("url") && /^https?:\/\//.test(content))
      );
    },
    execute: (content: string, _navigate?: (path: string) => void, _itemId?: string) => {
      if (!action.enabled) return;

      switch (action.type) {
        case "url":
          if (action.command) {
            const url = action.command.replace("CONTENT", encodeURIComponent(content));
            window.open(url, "_blank");
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
                window.open(content, "_blank");
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
