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
 */
export interface DisplayClipboardItem {
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
