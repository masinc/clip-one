import { invoke } from "@tauri-apps/api/core";
import { Clock, Copy, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DisplayClipboardItem } from "@/types/clipboardActions";
import { formatRelativeTime } from "@/utils/dateUtils";
import { getTypeIcon, truncateText } from "@/utils/textUtils";

interface ClipboardItemListProps {
  clipboardItems: DisplayClipboardItem[];
  loading: boolean;
  error: string | null;
  onHistoryReload: () => Promise<void>;
  onContextMenu: (e: React.MouseEvent, item: DisplayClipboardItem) => void;
}

export function ClipboardItemList({
  clipboardItems,
  loading,
  error,
  onHistoryReload,
  onContextMenu,
}: ClipboardItemListProps) {
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
      {clipboardItems.map((item, index) => (
        <Card
          key={item.id}
          className="mb-1 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors border hover:border-accent-foreground/20"
          onContextMenu={(e) => onContextMenu(e, item)}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <span className="text-xs">{getTypeIcon(item.type)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Hash className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(item.timestamp)}
                </div>
                {item.app && (
                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{item.app}</span>
                )}
              </div>

              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{truncateText(item.content)}</p>
            </div>

            <div className="flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer hover:bg-accent"
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(item.content);
                }}
                title="クリップボードにコピー"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
