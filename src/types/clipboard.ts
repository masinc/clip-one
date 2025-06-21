// クリップボードアイテムの型定義
export interface ClipboardItem {
  id: string;
  content: string;
  content_type: string;
  timestamp: number;
  is_favorite: boolean;
  source_app?: string;
  created_at: string; // ISO 8601 形式
}

// クリップボード統計の型定義
export interface ClipboardStats {
  total_items: number;
  favorite_items: number;
  content_type_counts: Record<string, number>;
}

// エクスポート形式の型定義
export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
}

// エクスポートデータの型定義
export interface ExportData {
  version: string;
  exported_at: string;
  total_items: number;
  items: ClipboardItem[];
}

// アプリケーション設定の型定義
export interface AppSettings {
  version: string;
  auto_start: boolean;
  max_history_items: number;
  hotkeys: Record<string, string>;
  theme: string;
  window: WindowSettings;
  notifications: NotificationSettings;
  database: DatabaseSettings;
  export_format: string;
}

export interface WindowSettings {
  width: number;
  height: number;
  remember_position: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  show_on_copy: boolean;
}

export interface DatabaseSettings {
  auto_cleanup: boolean;
  cleanup_days: number;
}