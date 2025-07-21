import { useCallback } from "react";
import { useClipboardControl } from "./useClipboardControl";

/**
 * 画像データをクリップボードにコピーするカスタムフック
 */
export function useImageCopy() {
  const { safeExecuteCopy } = useClipboardControl();

  const copyImageToClipboard = useCallback(
    async (base64DataUrl: string) => {
      return await safeExecuteCopy(
        base64DataUrl,
        async () => {
          try {
            // Base64データURLから実際のバイナリデータを取得
            const response = await fetch(base64DataUrl);
            const blob = await response.blob();

            // ClipboardItem を使用して画像データをクリップボードにコピー
            const clipboardItem = new ClipboardItem({
              [blob.type]: blob,
            });

            await navigator.clipboard.write([clipboardItem]);
            console.log("✅ 画像をクリップボードにコピーしました");
          } catch (error) {
            console.error("❌ 画像コピーエラー:", error);

            // フォールバック: Base64文字列をテキストとしてコピー
            try {
              await navigator.clipboard.writeText(base64DataUrl);
              console.log("⚠️ フォールバック: Base64文字列をテキストとしてコピーしました");
            } catch (fallbackError) {
              console.error("❌ フォールバックコピーエラー:", fallbackError);
              throw new Error("画像のコピーに失敗しました");
            }
          }
        },
        "image-copy",
      );
    },
    [safeExecuteCopy],
  );

  return { copyImageToClipboard };
}
