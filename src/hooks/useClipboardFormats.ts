import { useCallback, useState } from "react";
import type { DisplayClipboardItem } from "@/types/clipboardActions";

/**
 * クリップボードアイテムのフォーマット管理フック
 */
export function useClipboardFormats() {
  // 各アイテムの選択された形式を管理
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({});

  // 形式切り替えハンドラー
  const handleFormatChange = useCallback((itemId: string, format: string) => {
    setSelectedFormats((prev) => ({
      ...prev,
      [itemId]: format,
    }));
  }, []);

  // アイテムの現在の形式とコンテンツを取得
  const getCurrentFormatAndContent = useCallback(
    (item: DisplayClipboardItem) => {
      const selectedFormat = selectedFormats[item.id] || item.content_type;
      const content = item.format_contents?.[selectedFormat] || item.content;
      return { format: selectedFormat, content };
    },
    [selectedFormats],
  );

  return {
    selectedFormats,
    handleFormatChange,
    getCurrentFormatAndContent,
  };
}
