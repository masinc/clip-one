import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { ContextMenuState, ClipboardAction, DisplayClipboardItem } from "@/types/clipboardActions";

interface ContextMenuProps {
  contextMenu: ContextMenuState;
  searchQuery: string;
  selectedActionIndex: number;
  searchInputRef: React.RefObject<HTMLInputElement>;
  availableActions: {
    actions: ClipboardAction[];
    hasMore: boolean;
  };
  onSearchChange: (value: string) => void;
  onExecuteAction: (action: ClipboardAction, item: DisplayClipboardItem) => void;
  onShowAllActions: () => void;
}

export function ContextMenu({
  contextMenu,
  searchQuery,
  selectedActionIndex,
  searchInputRef,
  availableActions,
  onSearchChange,
  onExecuteAction,
  onShowAllActions,
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  if (!contextMenu.visible || !contextMenu.item) {
    return null;
  }

  const { actions, hasMore } = availableActions;

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={() => {}} // Handle close in parent
      />
      
      <div 
        ref={menuRef}
        className="fixed z-50 bg-card text-card-foreground border border-border rounded-md shadow-lg py-1 min-w-40 max-h-80 flex flex-col"
        style={{
          left: contextMenu.x,
          top: contextMenu.y,
        }}
      >
        <div className="border-b border-border bg-muted/50 px-2 py-2">
          <div className="flex items-center gap-2">
            <Search className="h-3 w-3 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="アクションを検索..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-6 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 m-0 p-0 flex-1 text-foreground"
              style={{ backgroundColor: 'transparent' }}
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {actions.map((action, index) => (
            <button
              key={action.id}
              className={`w-full text-left px-2 py-1.5 hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-xs ${
                index === selectedActionIndex ? 'bg-accent text-accent-foreground' : ''
              }`}
              onClick={() => onExecuteAction(action, contextMenu.item!)}
            >
              <action.icon className="h-3.5 w-3.5" />
              {action.label}
            </button>
          ))}
          {hasMore && !searchQuery && (
            <button
              className="w-full text-left px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-xs text-muted-foreground"
              onClick={onShowAllActions}
            >
              その他のアクション...
            </button>
          )}
        </div>
      </div>
    </>
  );
}