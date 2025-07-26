import { Clock, Copy, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormatBadges } from "@/components/ui/format-badges";
import { useImageCopy } from "@/hooks/useImageCopy";
import { useTextCopy } from "@/hooks/useTextCopy";
import type { DisplayClipboardItem } from "@/types/clipboardActions";
import { formatRelativeTime } from "@/utils/dateUtils";
import { getTypeIcon, getTypeName } from "@/utils/textUtils";
import { ClipboardContentRenderer } from "./ClipboardContentRenderer";

interface ClipboardItemProps {
  item: DisplayClipboardItem;
  index: number;
  isExpanded: boolean;
  currentFormat: string;
  currentContent: string;
  onItemClick: (itemId: string) => void;
  onFormatChange: (itemId: string, format: string) => void;
  onContextMenu: (e: React.MouseEvent, item: DisplayClipboardItem) => void;
}

export function ClipboardItem({
  item,
  index,
  isExpanded,
  currentFormat,
  currentContent,
  onItemClick,
  onFormatChange,
  onContextMenu,
}: ClipboardItemProps) {
  const { copyImageToClipboard } = useImageCopy();
  const { copyTextToClipboard } = useTextCopy();
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

        <div className="min-w-0 w-full space-y-2">
          <button
            type="button"
            className="min-w-0 cursor-default text-left bg-transparent border-none p-0 w-full"
            onClick={() => onItemClick(item.id)}
          >
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

            {/* コンテンツ表示 - 形式別の特殊表示 */}
            <ClipboardContentRenderer format={currentFormat} content={currentContent} isExpanded={isExpanded} />
          </button>

          {/* 複数形式バッジ - ボタン外に移動 */}
          {item.available_formats && (
            <FormatBadges
              availableFormats={item.available_formats}
              currentFormat={currentFormat}
              onFormatChange={(format) => onFormatChange(item.id, format)}
              mainFormat={item.content_type}
            />
          )}
        </div>

        <div className="ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-accent transition-opacity cursor-pointer"
            onClick={async (e) => {
              e.stopPropagation();

              // 画像データの場合は画像としてコピー、それ以外はテキストとしてコピー
              if (currentFormat === "image/png" && currentContent.startsWith("data:image/")) {
                await copyImageToClipboard(currentContent);
              } else {
                await copyTextToClipboard(currentContent);
              }
            }}
            title={
              currentFormat === "image/png" && currentContent.startsWith("data:image/")
                ? "画像をクリップボードにコピー"
                : "テキストをクリップボードにコピー"
            }
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
