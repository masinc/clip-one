import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Copy, Clock, Hash, MoreHorizontal, Settings, Download, Upload, Trash2, Info, Eye, Palette, Search, Languages, ExternalLink, Edit3 } from "lucide-react";
import { useState } from "react";

// アクション定義
interface ClipboardAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  execute: (content: string) => void;
  condition?: (content: string, type: string) => boolean;
}

const clipboardActions: ClipboardAction[] = [
  {
    id: 'copy',
    label: 'クリップボードにコピー',
    icon: Copy,
    execute: (content) => {
      navigator.clipboard.writeText(content);
      console.log('Copied to clipboard:', content);
    }
  },
  {
    id: 'search',
    label: 'Web検索',
    icon: Search,
    execute: (content) => {
      const query = content.length > 100 ? content.substring(0, 100) + '...' : content;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  },
  {
    id: 'translate',
    label: '翻訳',
    icon: Languages,
    execute: (content) => {
      window.open(`https://translate.google.com/?text=${encodeURIComponent(content)}`, '_blank');
    }
  },
  {
    id: 'open-url',
    label: 'URLを開く',
    icon: ExternalLink,
    execute: (content) => {
      window.open(content, '_blank');
    },
    condition: (content, type) => type === 'url' || /^https?:\/\//.test(content)
  },
  {
    id: 'edit',
    label: '編集',
    icon: Edit3,
    execute: (content) => {
      console.log('Edit content:', content);
      // TODO: 編集モーダルを開く
    }
  }
];

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
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    item: typeof mockClipboardItems[0] | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    item: null
  });

  // コンテキストメニューを開く
  const handleContextMenu = (e: React.MouseEvent, item: typeof mockClipboardItems[0]) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      item
    });
  };

  // コンテキストメニューを閉じる
  const closeContextMenu = () => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  // アクションを実行
  const executeAction = (action: ClipboardAction, item: typeof mockClipboardItems[0]) => {
    action.execute(item.content);
    closeContextMenu();
  };

  // アイテムに対して利用可能なアクションを取得
  const getAvailableActions = (item: typeof mockClipboardItems[0]) => {
    return clipboardActions.filter(action => 
      !action.condition || action.condition(item.content, item.type)
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
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
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4" />
                    設定
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Palette className="h-4 w-4" />
                    テーマ
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="h-4 w-4" />
                    表示設定
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Download className="h-4 w-4" />
                    エクスポート
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="h-4 w-4" />
                    インポート
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                    履歴を削除
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
                className="mb-1 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onContextMenu={(e) => handleContextMenu(e, item)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="text-xs">{getTypeIcon(item.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="h-3 w-3 text-gray-500" />
                      <span className="text-xs font-mono text-gray-500">{index + 1}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(item.timestamp)}
                      </div>
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
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
          {/* オーバーレイ */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeContextMenu}
          />
          
          {/* メニュー */}
          <div 
            className="fixed z-50 bg-white border rounded-md shadow-lg py-1 min-w-48"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {getAvailableActions(contextMenu.item).map((action) => (
              <button
                key={action.id}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2 text-sm"
                onClick={() => executeAction(action, contextMenu.item!)}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </button>
            ))}
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