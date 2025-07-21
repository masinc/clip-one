/**
 * クリップボードアクション型定義
 */
export interface ClipboardAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  execute: (content: string, navigate?: (path: string) => void, itemId?: string) => void | Promise<void>;
  condition?: (content: string, type: string) => boolean;
  priority?: number;
  keywords?: string[];
}

/**
 * クリップボードアイテム（表示用）型定義
 * 正規化されたデータベースとの互換性を保つ
 */
export interface DisplayClipboardItem {
  id: string;
  content: string;
  content_type: string; // typeからcontent_typeに変更（Rustと同期）
  timestamp: number; // Dateからnumberに変更（Unix timestamp）
  is_favorite: boolean;
  source_app?: string; // appからsource_appに変更
  created_at: string; // DateTime UTCの文字列表現
  available_formats?: string[];
  format_contents?: Record<string, string>;
}

/**
 * フロントエンド表示用のアダプターインターフェース（後方互換性）
 */
export interface LegacyDisplayClipboardItem {
  id: string;
  content: string;
  type: string;
  timestamp: Date;
  app?: string;
  availableFormats?: string[];
  formatContents?: Record<string, string>;
}

/**
 * コンテキストメニュー状態型定義
 */
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  item: DisplayClipboardItem | null;
}
