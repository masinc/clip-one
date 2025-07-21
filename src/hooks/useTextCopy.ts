import { useCallback } from "react";
import { useClipboardControl } from "./useClipboardControl";

/**
 * テキストデータをクリップボードにコピーするカスタムフック（監視一時停止付き）
 */
export function useTextCopy() {
  const { safeExecuteCopy } = useClipboardControl();

  const copyTextToClipboard = useCallback(
    async (text: string) => {
      return await safeExecuteCopy(
        text,
        async () => {
          try {
            await navigator.clipboard.writeText(text);
            console.log("✅ テキストをクリップボードにコピーしました");
          } catch (error) {
            console.error("❌ テキストコピーエラー:", error);
            throw new Error("テキストのコピーに失敗しました");
          }
        },
        "text-copy",
      );
    },
    [safeExecuteCopy],
  );

  return { copyTextToClipboard };
}
