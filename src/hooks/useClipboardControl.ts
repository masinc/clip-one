import { useCallback } from "react";
import { emit } from "@tauri-apps/api/event";

/**
 * クリップボード制御のカスタムフック
 * イベントベースでRust側に明示的にコピーアクションを通知
 */
export function useClipboardControl() {
  // コピーアクション開始を通知
  const notifyStartCopy = useCallback(async (content: string, source: string = "ui") => {
    try {
      await emit("copy-action-start", { content, source, timestamp: Date.now() });
      console.log(`📤 コピーアクション開始通知: ${source}`);
    } catch (error) {
      console.error("❌ コピー開始通知エラー:", error);
    }
  }, []);

  // コピーアクション完了を通知
  const notifyEndCopy = useCallback(async (content: string, source: string = "ui") => {
    try {
      await emit("copy-action-end", { content, source, timestamp: Date.now() });
      console.log(`📥 コピーアクション完了通知: ${source}`);
    } catch (error) {
      console.error("❌ コピー完了通知エラー:", error);
    }
  }, []);

  // 安全なコピー実行（通知付き）
  const safeExecuteCopy = useCallback(async <T>(
    content: string,
    copyAction: () => Promise<T>,
    source: string = "ui"
  ): Promise<T> => {
    await notifyStartCopy(content, source);
    
    try {
      const result = await copyAction();
      // コピー完了を即座に通知
      await notifyEndCopy(content, source);
      return result;
    } catch (error) {
      // エラーが発生した場合でも完了通知を送信
      await notifyEndCopy(content, source);
      throw error;
    }
  }, [notifyStartCopy, notifyEndCopy]);

  return {
    notifyStartCopy,
    notifyEndCopy,
    safeExecuteCopy,
  };
}