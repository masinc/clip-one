import { useClipboardFormats } from "@/hooks/useClipboardFormats";
import type { DisplayClipboardItem } from "@/types/clipboardActions";
import { ClipboardItem } from "./ClipboardItem";
import { EmptyView, ErrorView, LoadingView } from "./ClipboardStateViews";

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
  const { handleFormatChange, getCurrentFormatAndContent } = useClipboardFormats();

  if (error) {
    return <ErrorView error={error} onHistoryReload={onHistoryReload} />;
  }

  if (loading) {
    return <LoadingView />;
  }

  if (clipboardItems.length === 0) {
    return <EmptyView onHistoryReload={onHistoryReload} />;
  }

  return (
    <div className="p-2 relative">
      {clipboardItems.map((item, index) => {
        const isExpanded = expandedItems.has(item.id);
        const { format: currentFormat, content: currentContent } = getCurrentFormatAndContent(item);

        return (
          <ClipboardItem
            key={item.id}
            item={item}
            index={index}
            isExpanded={isExpanded}
            currentFormat={currentFormat}
            currentContent={currentContent}
            onItemClick={onItemClick}
            onFormatChange={handleFormatChange}
            onContextMenu={onContextMenu}
          />
        );
      })}
    </div>
  );
}
