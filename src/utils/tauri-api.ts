import { invoke } from "@tauri-apps/api/core";
import type { AppSettings, ClipboardItem, ClipboardStats, ExportFormat } from "@/types/clipboard";
import type { DisplayClipboardItem } from "@/types/clipboardActions";

// クリップボード操作API
export const clipboardApi = {
  // クリップボード読み取り
  getText: (): Promise<string> => invoke("get_clipboard_text"),

  // クリップボード書き込み
  setText: (text: string): Promise<void> => invoke("set_clipboard_text", { text }),

  // 監視開始/停止
  startMonitoring: (): Promise<void> => invoke("start_clipboard_monitoring"),

  stopMonitoring: (): Promise<void> => invoke("stop_clipboard_monitoring"),

  // アイテム保存
  saveItem: (content: string, contentType?: string, sourceApp?: string): Promise<ClipboardItem> =>
    invoke("save_clipboard_item", { content, contentType, sourceApp }),

  // 重複チェック
  checkDuplicate: (content: string): Promise<boolean> => invoke("check_duplicate_content", { content }),

  // 監視サービス
  startMonitoringService: (): Promise<void> => invoke("start_clipboard_monitoring_service"),

  stopMonitoringService: (): Promise<void> => invoke("stop_clipboard_monitoring_service"),

  getMonitoringStatus: (): Promise<boolean> => invoke("get_clipboard_monitoring_status"),
};

// 履歴管理API
export const historyApi = {
  // 履歴取得（正規化されたデータベース用）
  getHistory: (limit?: number, offset?: number): Promise<DisplayClipboardItem[]> =>
    invoke("get_clipboard_history", { limit: limit || null, offset: offset || null }),

  // 履歴検索（正規化されたデータベース用）
  searchHistory: (query: string, limit?: number): Promise<DisplayClipboardItem[]> =>
    invoke("search_clipboard_history", { query, limit }),

  // 特定アイテム取得（正規化されたデータベース用）
  getItem: (id: string): Promise<DisplayClipboardItem | null> => invoke("get_clipboard_item", { id }),

  // お気に入り切り替え
  toggleFavorite: (id: string): Promise<boolean> => invoke("toggle_favorite", { id }),

  // アイテム削除
  deleteItem: (id: string): Promise<void> => invoke("delete_clipboard_item", { id }),

  // 履歴クリア
  clearHistory: (): Promise<void> => invoke("clear_clipboard_history"),

  // 統計取得
  getStats: (): Promise<ClipboardStats> => invoke("get_clipboard_stats"),

  // 古いアイテムクリーンアップ
  cleanupOldItems: (maxItems: number): Promise<void> => invoke("cleanup_old_items", { maxItems }),
};

// 設定管理API
export const settingsApi = {
  // 設定取得
  getSettings: (): Promise<AppSettings> => invoke("get_app_settings"),

  // 設定保存
  saveSettings: (settings: AppSettings): Promise<void> => invoke("save_app_settings", { settings }),

  // 個別設定更新
  updateSetting: (key: string, value: unknown): Promise<void> => invoke("update_setting", { key, value }),

  // 設定リセット
  resetSettings: (): Promise<AppSettings> => invoke("reset_settings"),
};

// エクスポート/インポートAPI
export const exportApi = {
  // JSON エクスポート
  exportJson: (): Promise<string> => invoke("export_clipboard_history_json"),

  // CSV エクスポート
  exportCsv: (): Promise<string> => invoke("export_clipboard_history_csv"),

  // JSON インポート
  importJson: (jsonData: string): Promise<number> => invoke("import_clipboard_history_json", { jsonData }),

  // ファイル保存
  saveExportFile: (filePath: string, content: string): Promise<void> =>
    invoke("save_export_file", { filePath, content }),

  // ファイル読み込み
  loadImportFile: (filePath: string): Promise<string> => invoke("load_import_file", { filePath }),

  // エクスポート形式取得
  getExportFormats: (): Promise<ExportFormat[]> => invoke("get_export_formats"),
};

// 統合API（すべてのAPIを含む）
export const tauriApi = {
  clipboard: clipboardApi,
  history: historyApi,
  settings: settingsApi,
  export: exportApi,
};

export default tauriApi;
