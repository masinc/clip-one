// クリップボードアイテムの型定義
export interface ClipboardItem {
  id: string;
  content: string;
  content_type: string;
  timestamp: number;
  is_favorite: boolean;
  source_app?: string;
  created_at: string; // ISO 8601 形式
  available_formats?: string | string[]; // JSON文字列または配列
  primary_format?: string;
  data_size?: number;
  format_contents?: string | Record<string, string>; // JSON文字列またはオブジェクト
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

// アプリケーション情報の型定義
export interface AppInfo {
  name: string; // アプリ名
  version: string; // バージョン（Cargo.tomlから）
  description: string; // アプリ説明
  author: string; // 作者
  license?: string; // ライセンス
  repository?: string; // リポジトリURL
  homepage?: string; // ホームページ
  build_date: string; // ビルド日時
}

// アプリケーション設定の型定義（簡素化）
export interface AppSettings {
  max_history_items: number;
  hotkeys: Record<string, string>;
  theme: string;
  export_format: string;
  notifications_enabled: boolean;
}
