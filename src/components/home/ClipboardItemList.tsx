import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Clock, Copy, Hash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormatBadges } from "@/components/ui/format-badges";
import type { DisplayClipboardItem } from "@/types/clipboardActions";
import { formatRelativeTime } from "@/utils/dateUtils";
import { getTypeIcon, getTypeName, parseFileList, truncateText } from "@/utils/textUtils";

interface ClipboardItemListProps {
  clipboardItems: DisplayClipboardItem[];
  loading: boolean;
  error: string | null;
  expandedItems: Set<string>;
  onItemClick: (itemId: string) => void;
  onHistoryReload: () => Promise<void>;
  onContextMenu: (e: React.MouseEvent, item: DisplayClipboardItem) => void;
}

export function ClipboardItemList({
  clipboardItems,
  loading,
  error,
  expandedItems,
  onItemClick,
  onHistoryReload,
  onContextMenu,
}: ClipboardItemListProps) {
  // 各アイテムの選択された形式を管理
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({});

  // 形式切り替えハンドラー
  const handleFormatChange = (itemId: string, format: string) => {
    setSelectedFormats((prev) => ({
      ...prev,
      [itemId]: format,
    }));
  };

  // アイテムの現在の形式とコンテンツを取得
  const getCurrentFormatAndContent = (item: DisplayClipboardItem) => {
    const selectedFormat = selectedFormats[item.id] || item.content_type;
    const content = item.format_contents?.[selectedFormat] || item.content;
    return { format: selectedFormat, content };
  };

  const handleAddTestData = async () => {
    try {
      const result = await invoke("add_test_data");
      console.log("テストデータ追加結果:", result);
      await onHistoryReload();
    } catch (err) {
      console.error("テストデータ追加エラー:", err);
    }
  };

  if (error) {
    return (
      <div className="p-2">
        <Card className="mb-2 p-3 border-red-200 bg-red-50 text-red-800">
          <p className="text-sm">{error}</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={onHistoryReload}>
              再試行
            </Button>
            {process.env.NODE_ENV === "development" && (
              <Button variant="outline" size="sm" onClick={handleAddTestData}>
                テストデータ追加
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-2">
        <Card className="mb-2 p-3">
          <p className="text-sm text-muted-foreground">履歴を読み込み中...</p>
        </Card>
      </div>
    );
  }

  if (clipboardItems.length === 0) {
    return (
      <div className="p-2">
        <Card className="mb-2 p-3">
          <p className="text-sm text-muted-foreground mb-2">まだクリップボード履歴がありません。</p>
          {process.env.NODE_ENV === "development" && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleAddTestData}>
                テストデータ追加
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2">
      {clipboardItems.map((item, index) => {
        const isExpanded = expandedItems.has(item.id);
        const { format: currentFormat, content: currentContent } = getCurrentFormatAndContent(item);
        const shouldTruncate = currentContent.length > 100;
        const displayContent = isExpanded || !shouldTruncate ? currentContent : truncateText(currentContent);

        return (
          <Card
            key={item.id}
            className="mb-1 p-3 hover:bg-accent hover:text-accent-foreground transition-colors border hover:border-accent-foreground/20 group"
            onContextMenu={(e) => onContextMenu(e, item)}
          >
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
              <div className="mt-0.5">
                <span className="text-xs">{getTypeIcon(currentFormat)}</span>
              </div>

              <div className="min-w-0 cursor-default text-left" onClick={() => onItemClick(item.id)}>
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(item.timestamp)}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    {getTypeName(currentFormat)}
                  </span>
                </div>

                {/* 複数形式バッジ */}
                {item.available_formats && (
                  <FormatBadges
                    availableFormats={item.available_formats}
                    currentFormat={currentFormat}
                    onFormatChange={(format) => handleFormatChange(item.id, format)}
                    mainFormat={item.content_type}
                  />
                )}

                {/* コンテンツ表示 - 形式別の特殊表示 */}
                {currentFormat === "text/uri-list" ? (
                  // URL表示 - クリック可能なリンク
                  <div className="text-sm">
                    <button
                      type="button"
                      className="text-blue-500 hover:text-blue-700 underline break-words cursor-pointer text-left w-full"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await openUrl(currentContent.trim());
                        } catch (error) {
                          console.error("URL開く失敗:", error);
                        }
                      }}
                      title={`${currentContent} を外部ブラウザで開く`}
                    >
                      {displayContent}
                    </button>
                  </div>
                ) : currentFormat === "application/x-file-list" ? (
                  // ファイルリスト表示 - アイコン付きリスト
                  <div className="text-sm space-y-1">
                    {parseFileList(currentContent)
                      .slice(0, isExpanded ? undefined : 3)
                      .map((file, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-base">{file.icon}</span>
                          <span className="break-words">{file.filename}</span>
                        </div>
                      ))}
                    {!isExpanded && parseFileList(currentContent).length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{parseFileList(currentContent).length - 3}個のファイル...
                      </div>
                    )}
                  </div>
                ) : (
                  // 通常のテキスト表示
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{displayContent}</p>
                )}
              </div>

              <div className="ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-accent transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(currentContent);
                  }}
                  title="クリップボードにコピー"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
