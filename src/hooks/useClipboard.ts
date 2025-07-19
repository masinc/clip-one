import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useCallback, useEffect, useState } from "react";
import type { ClipboardItem } from "@/types/clipboard";

export interface ClipboardHook {
  currentText: string;
  isMonitoring: boolean;
  readClipboard: () => Promise<string>;
  writeClipboard: (text: string) => Promise<void>;
  startMonitoring: (onUpdate?: (text: string) => void) => Promise<void>;
  stopMonitoring: () => Promise<void>;
  hasClipboardText: () => Promise<boolean>;
  clearClipboard: () => Promise<void>;
  error: string | null;
}

export function useClipboard(): ClipboardHook {
  const [currentText, setCurrentText] = useState<string>("");
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [eventUnlisten, setEventUnlisten] = useState<UnlistenFn | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const readClipboard = useCallback(async (): Promise<string> => {
    try {
      clearError();
      const text = await invoke<string>("get_clipboard_text");
      setCurrentText(text);
      return text;
    } catch (err) {
      const errorMsg = `クリップボード読み取りエラー: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [clearError]);

  const writeClipboard = useCallback(
    async (text: string): Promise<void> => {
      try {
        clearError();
        await invoke("set_clipboard_text", { text });
        setCurrentText(text);
      } catch (err) {
        const errorMsg = `クリップボード書き込みエラー: ${err}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [clearError],
  );

  const hasClipboardText = useCallback(async (): Promise<boolean> => {
    try {
      clearError();
      return await invoke<boolean>("has_clipboard_text");
    } catch (err) {
      const errorMsg = `クリップボード状態チェックエラー: ${err}`;
      setError(errorMsg);
      return false;
    }
  }, [clearError]);

  const clearClipboard = useCallback(async (): Promise<void> => {
    try {
      clearError();
      await invoke("clear_clipboard_text");
      setCurrentText("");
    } catch (err) {
      const errorMsg = `クリップボードクリアエラー: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [clearError]);

  const startMonitoring = useCallback(
    async (onUpdate?: (text: string) => void): Promise<void> => {
      try {
        clearError();

        if (isMonitoring) {
          console.log("クリップボード監視は既に開始されています");
          return;
        }

        console.log("🚀 Rustイベントベースのクリップボード監視を開始...");

        // Rustのイベントをリッスン
        const unlisten = await listen<ClipboardItem>("clipboard-updated", (event) => {
          console.log("📨 Rustからclipboard-updatedイベント受信:", event.payload);
          const item = event.payload;
          setCurrentText(item.content);
          onUpdate?.(item.content);
        });

        setEventUnlisten(() => unlisten);

        // Rust側で監視開始
        await invoke("start_clipboard_monitoring");

        // 監視状態を確認
        const monitoringStatus = await invoke<boolean>("get_monitoring_status");
        setIsMonitoring(monitoringStatus);

        console.log("✅ Rustイベントベースのクリップボード監視を開始しました");
      } catch (err) {
        const errorMsg = `クリップボード監視開始エラー: ${err}`;
        console.error("❌", errorMsg);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    },
    [isMonitoring, clearError],
  );

  const stopMonitoring = useCallback(async (): Promise<void> => {
    try {
      clearError();

      if (!isMonitoring) {
        console.log("クリップボード監視は既に停止されています");
        return;
      }

      console.log("🛑 Rustイベントベースのクリップボード監視を停止...");

      // Rust側で監視停止
      await invoke("stop_clipboard_monitoring");

      // イベントリスナーを停止
      if (eventUnlisten) {
        eventUnlisten();
        setEventUnlisten(null);
      }

      setIsMonitoring(false);
      console.log("✅ クリップボード監視を停止しました");
    } catch (err) {
      const errorMsg = `クリップボード監視停止エラー: ${err}`;
      setError(errorMsg);
      console.error(errorMsg);
      // エラーでも状態をリセット
      setIsMonitoring(false);
      setEventUnlisten(null);
    }
  }, [isMonitoring, eventUnlisten, clearError]);

  // コンポーネントアンマウント時の自動クリーンアップ
  useEffect(() => {
    return () => {
      if (eventUnlisten) {
        eventUnlisten();
      }
      if (isMonitoring) {
        stopMonitoring().catch(console.error);
      }
    };
  }, [isMonitoring, eventUnlisten, stopMonitoring]);

  return {
    currentText,
    isMonitoring,
    readClipboard,
    writeClipboard,
    startMonitoring,
    stopMonitoring,
    hasClipboardText,
    clearClipboard,
    error,
  };
}
