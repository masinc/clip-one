import { invoke } from "@tauri-apps/api/core";

// Tauri プラグインのJavaScriptバインディング

/**
 * 自動起動関連のAPI
 */
export const autostartApi = {
  /**
   * 自動起動が有効かどうかを取得
   */
  async isEnabled(): Promise<boolean> {
    try {
      return await invoke("plugin:autostart|is_enabled");
    } catch (error) {
      console.error("自動起動状態取得エラー:", error);
      return false;
    }
  },

  /**
   * 自動起動を有効にする
   */
  async enable(): Promise<void> {
    try {
      await invoke("plugin:autostart|enable");
    } catch (error) {
      console.error("自動起動有効化エラー:", error);
      throw error;
    }
  },

  /**
   * 自動起動を無効にする
   */
  async disable(): Promise<void> {
    try {
      await invoke("plugin:autostart|disable");
    } catch (error) {
      console.error("自動起動無効化エラー:", error);
      throw error;
    }
  },
};

/**
 * ウィンドウ状態関連のAPI
 */
export const windowStateApi = {
  /**
   * ウィンドウ状態を保存
   */
  async saveWindowState(): Promise<void> {
    try {
      await invoke("plugin:window-state|save_window_state");
    } catch (error) {
      console.error("ウィンドウ状態保存エラー:", error);
      throw error;
    }
  },

  /**
   * ウィンドウ状態を復元
   */
  async restoreWindowState(): Promise<void> {
    try {
      await invoke("plugin:window-state|restore_state");
    } catch (error) {
      console.error("ウィンドウ状態復元エラー:", error);
      throw error;
    }
  },
};
