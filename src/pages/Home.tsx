import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Clock, Hash, MoreHorizontal, Settings, Info, Search, Languages, ExternalLink, Edit3, Bot, QrCode, FileText, Code, Mail, Bookmark, Calculator, Music, Brain, Sparkles, MessageSquare, GitBranch, Terminal, Lock, Key, Shuffle, RotateCcw, RefreshCw, Calendar, Users, Folder, Archive, Scissors, Sliders } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useActions, GlobalAction } from "@/contexts/ActionsContext";

// アイコンマッピング
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Copy, Search, Languages, Bot, Brain, Sparkles, Code, Terminal, GitBranch, 
  Mail, Calculator, Lock, Key, Shuffle, Hash, Music, Scissors, QrCode, 
  ExternalLink, Edit3, Bookmark, FileText, Calendar, Users, Folder, 
  Archive, MessageSquare, RotateCcw, RefreshCw
};

// アクション型定義
interface ClipboardAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  execute: (content: string, navigate?: (path: string) => void, itemId?: number) => void;
  condition?: (content: string, type: string) => boolean;
  priority?: number;
  keywords?: string[];
}

// GlobalActionをClipboardActionに変換する関数
const convertToClipboardAction = (action: GlobalAction, navigate?: (path: string) => void): ClipboardAction => {
  const IconComponent = iconMap[action.icon] || Code;
  
  return {
    id: action.id,
    label: action.label,
    icon: IconComponent,
    priority: action.priority,
    keywords: action.keywords,
    condition: (content: string, type: string) => {
      return action.allowedContentTypes.includes(type) || 
             (action.allowedContentTypes.includes('url') && /^https?:\/\//.test(content));
    },
    execute: (content: string, nav?: (path: string) => void, itemId?: number) => {
      if (!action.enabled) return;
      
      switch (action.type) {
        case 'url':
          if (action.command) {
            const url = action.command.replace('CONTENT', encodeURIComponent(content));
            window.open(url, '_blank');
          }
          break;
        case 'code':
          if (action.command) {
            try {
              const code = action.command.replace(/CONTENT/g, JSON.stringify(content));
              eval(code);
            } catch (e) {
              console.error('Code execution error:', e);
            }
          }
          break;
        case 'built-in':
          // 組み込みアクションの処理
          switch (action.id) {
            case 'copy':
              navigator.clipboard.writeText(content);
              break;
            case 'open-url':
              if (/^https?:\/\//.test(content)) {
                window.open(content, '_blank');
              }
              break;
            default:
              console.log('Built-in action:', action.id, content);
          }
          break;
        default:
          console.log('Unknown action type:', action.type);
      }
    }
  };
};

// モックデータ
const mockClipboardItems = [
  { id: 1, content: "const handleClick = () => {\n  console.log('Button clicked');\n};", type: "text", timestamp: new Date(Date.now() - 1000 * 60 * 2), app: "VS Code" },
  { id: 2, content: "https://github.com/masinc/clip-one", type: "url", timestamp: new Date(Date.now() - 1000 * 60 * 5), app: "Chrome" },
  { id: 3, content: "React Router v7の導入方法について", type: "text", timestamp: new Date(Date.now() - 1000 * 60 * 10), app: "Notion" },
  { id: 4, content: "pnpm add react-router", type: "text", timestamp: new Date(Date.now() - 1000 * 60 * 15), app: "Terminal" },
  { id: 5, content: "ClipOneはクリップボード管理アプリケーションです。", type: "text", timestamp: new Date(Date.now() - 1000 * 60 * 30), app: "TextEdit" },
  { id: 6, content: "npm install @tailwindcss/vite tailwindcss", type: "text", timestamp: new Date(Date.now() - 1000 * 60 * 45), app: "Terminal" },
  { id: 7, content: "user@example.com", type: "text", timestamp: new Date(Date.now() - 1000 * 60 * 60), app: "Mail" },
  { id: 8, content: "{\n  \"name\": \"clip-one\",\n  \"version\": \"0.1.0\"\n}", type: "text", timestamp: new Date(Date.now() - 1000 * 60 * 90), app: "VS Code" },
];

function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return "今";
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  return date.toLocaleDateString();
}

function truncateText(text: string, maxLength: number = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'url':
      return '🌐';
    case 'text':
    default:
      return '📝';
  }
}

export default function Home() {
  const navigate = useNavigate();
  const { actions } = useActions();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    originalX: number;
    originalY: number;
    item: typeof mockClipboardItems[0] | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    originalX: 0,
    originalY: 0,
    item: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [showAllActions, setShowAllActions] = useState(false);

  // コンテキストからアクションを取得して変換する関数
  const getClipboardActions = () => {
    return actions
      .filter(action => action.enabled)
      .map(action => convertToClipboardAction(action, navigate));
  };

  // メニュー位置を調整する関数
  const calculateMenuPosition = (clientX: number, clientY: number) => {
    const padding = 8;
    let menuWidth = 200;
    let menuHeight = 300;
    
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      menuWidth = rect.width;
      menuHeight = rect.height;
    }
    
    let x = clientX;
    let y = clientY;
    
    if (x + menuWidth > window.innerWidth - padding) {
      x = Math.max(padding, clientX - menuWidth);
    }
    
    if (y + menuHeight > window.innerHeight - padding) {
      y = Math.max(padding, clientY - menuHeight);
    }
    
    if (x < padding) {
      x = padding;
    }
    
    if (y < padding) {
      y = padding;
    }
    
    if (x + menuWidth > window.innerWidth - padding) {
      x = Math.max(padding, window.innerWidth - menuWidth - padding);
    }
    
    if (y + menuHeight > window.innerHeight - padding) {
      y = Math.max(padding, window.innerHeight - menuHeight - padding);
    }
    
    return { x, y };
  };

  // コンテキストメニューを開く
  const handleContextMenu = (e: React.MouseEvent, item: typeof mockClipboardItems[0]) => {
    e.preventDefault();
    
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0, originalX: 0, originalY: 0, item: null });
      setTimeout(() => {
        const { x, y } = calculateMenuPosition(e.clientX, e.clientY);
        setContextMenu({
          visible: true,
          x,
          y,
          originalX: e.clientX,
          originalY: e.clientY,
          item
        });
      }, 50);
    } else {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        originalX: e.clientX,
        originalY: e.clientY,
        item
      });
      
      setTimeout(() => {
        const { x, y } = calculateMenuPosition(e.clientX, e.clientY);
        setContextMenu(prev => ({
          ...prev,
          x,
          y
        }));
      }, 0);
    }
  };

  // コンテキストメニューを閉じる
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
    setSearchQuery('');
    setSelectedActionIndex(0);
    setShowAllActions(false);
  };

  // 「その他のアクション」をクリックした時の処理
  const handleShowAllActions = () => {
    setShowAllActions(true);
    setTimeout(() => {
      if (contextMenu.visible && contextMenu.item) {
        const { x, y } = calculateMenuPosition(contextMenu.originalX, contextMenu.originalY);
        setContextMenu(prev => ({
          ...prev,
          x,
          y
        }));
      }
    }, 0);
  };

  // アクションを実行
  const executeAction = (action: ClipboardAction, item: typeof mockClipboardItems[0]) => {
    action.execute(item.content, navigate, item.id);
    closeContextMenu();
  };

  // アクション検索機能
  const searchActions = (actions: ClipboardAction[], query: string) => {
    if (!query.trim()) return actions;
    
    const lowercaseQuery = query.toLowerCase();
    return actions.filter(action => 
      action.label.toLowerCase().includes(lowercaseQuery) ||
      action.keywords?.some(keyword => keyword.toLowerCase().includes(lowercaseQuery))
    );
  };

  // アイテムに対して利用可能なアクションを取得
  const getAvailableActions = (item: typeof mockClipboardItems[0]) => {
    const clipboardActions = getClipboardActions();
    
    const availableActions = clipboardActions.filter(action => 
      !action.condition || action.condition(item.content, item.type)
    );

    const filteredActions = searchActions(availableActions, searchQuery);
    const sortedActions = filteredActions.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    if (searchQuery.trim() || showAllActions) {
      return {
        actions: sortedActions,
        hasMore: false,
        allActions: sortedActions
      };
    }

    const topActions = sortedActions.slice(0, 3);
    const hasMore = sortedActions.length > 3;
    
    return {
      actions: topActions,
      hasMore,
      allActions: sortedActions
    };
  };

  return (
    <div 
      className="flex flex-col h-screen bg-background"
      onContextMenu={(e) => {
        if (contextMenu.visible) {
          e.preventDefault();
          closeContextMenu();
        }
      }}
    >
      {/* ヘッダー */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">ClipOne</h1>
            <div className="flex gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="h-4 w-4" />
                    設定
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/actions-settings')}>
                    <Sliders className="h-4 w-4" />
                    アクション設定
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Info className="h-4 w-4" />
                    ClipOne について
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <input 
            placeholder="履歴を検索..." 
            className="search-input h-9 w-full bg-card text-foreground border border-border rounded-md px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {mockClipboardItems.map((item, index) => (
              <Card 
                key={item.id} 
                className="mb-1 p-3 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors border hover:border-accent-foreground/20"
                onContextMenu={(e) => handleContextMenu(e, item)}
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
                      <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                        {item.app}
                      </span>
                    </div>
                    
                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {truncateText(item.content)}
                    </p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* コンテキストメニュー */}
      {contextMenu.visible && contextMenu.item && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeContextMenu}
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedActionIndex(0);
                  }}
                  className="h-6 text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 m-0 p-0 flex-1 text-foreground"
                  style={{ backgroundColor: 'transparent' }}
                  autoFocus
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {(() => {
                const { actions, hasMore } = getAvailableActions(contextMenu.item);
                return (
                  <>
                    {actions.map((action, index) => (
                      <button
                        key={action.id}
                        className={`w-full text-left px-2 py-1.5 hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-xs ${
                          index === selectedActionIndex ? 'bg-accent text-accent-foreground' : ''
                        }`}
                        onClick={() => executeAction(action, contextMenu.item!)}
                      >
                        <action.icon className="h-3.5 w-3.5" />
                        {action.label}
                      </button>
                    ))}
                    {hasMore && !searchQuery && !showAllActions && (
                      <button
                        className="w-full text-left px-2 py-1.5 hover:bg-accent hover:text-accent-foreground text-xs text-muted-foreground"
                        onClick={handleShowAllActions}
                      >
                        その他のアクション...
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {/* フッター */}
      <div className="flex-shrink-0 border-t bg-card p-2">
        <div className="flex justify-end">
          <div className="text-xs text-muted-foreground px-2 py-1">
            {mockClipboardItems.length}件
          </div>
        </div>
      </div>
    </div>
  );
}