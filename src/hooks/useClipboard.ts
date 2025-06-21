import { useState, useCallback, useEffect } from 'react';
import { 
  readText, 
  writeText, 
  startListening, 
  onTextUpdate,
  hasText,
  clear
} from 'tauri-plugin-clipboard-api';
import type { UnlistenFn } from '@tauri-apps/api/event';

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
  const [currentText, setCurrentText] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [unlistenMain, setUnlistenMain] = useState<(() => Promise<void>) | null>(null);
  const [unlistenText, setUnlistenText] = useState<UnlistenFn | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const readClipboard = useCallback(async (): Promise<string> => {
    try {
      clearError();
      const text = await readText();
      setCurrentText(text);
      return text;
    } catch (err) {
      const errorMsg = `クリップボード読み取りエラー: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [clearError]);

  const writeClipboard = useCallback(async (text: string): Promise<void> => {
    try {
      clearError();
      await writeText(text);
      setCurrentText(text);
    } catch (err) {
      const errorMsg = `クリップボード書き込みエラー: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [clearError]);

  const hasClipboardText = useCallback(async (): Promise<boolean> => {
    try {
      clearError();
      return await hasText();
    } catch (err) {
      const errorMsg = `クリップボード状態チェックエラー: ${err}`;
      setError(errorMsg);
      return false;
    }
  }, [clearError]);

  const clearClipboard = useCallback(async (): Promise<void> => {
    try {
      clearError();
      await clear();
      setCurrentText('');
    } catch (err) {
      const errorMsg = `クリップボードクリアエラー: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [clearError]);

  const startMonitoring = useCallback(async (onUpdate?: (text: string) => void): Promise<void> => {
    try {
      clearError();
      
      if (isMonitoring) {
        console.log('クリップボード監視は既に開始されています');
        return;
      }

      // テキスト変更の監視を設定
      const textUnlisten = await onTextUpdate((newText: string) => {
        console.log('クリップボードテキスト更新:', newText);
        setCurrentText(newText);
        onUpdate?.(newText);
      });
      setUnlistenText(textUnlisten);

      // メイン監視を開始
      const mainUnlisten = await startListening();
      setUnlistenMain(mainUnlisten);

      setIsMonitoring(true);
      console.log('クリップボード監視を開始しました');
    } catch (err) {
      const errorMsg = `クリップボード監視開始エラー: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isMonitoring, clearError]);

  const stopMonitoring = useCallback(async (): Promise<void> => {
    try {
      clearError();
      
      if (!isMonitoring) {
        console.log('クリップボード監視は既に停止されています');
        return;
      }

      // 各種監視を停止
      if (unlistenText) {
        unlistenText();
        setUnlistenText(null);
      }

      if (unlistenMain) {
        await unlistenMain();
        setUnlistenMain(null);
      }

      setIsMonitoring(false);
      console.log('クリップボード監視を停止しました');
    } catch (err) {
      const errorMsg = `クリップボード監視停止エラー: ${err}`;
      setError(errorMsg);
      throw new Error(errorMsg);
    }
  }, [isMonitoring, unlistenMain, unlistenText, clearError]);

  // コンポーネントアンマウント時の自動クリーンアップ
  useEffect(() => {
    return () => {
      if (isMonitoring) {
        stopMonitoring().catch(console.error);
      }
    };
  }, [isMonitoring, stopMonitoring]);

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