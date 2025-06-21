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
import { Copy, Clock, Hash, MoreHorizontal, Settings, Info, Search, Languages, ExternalLink, Edit3, Bot, QrCode, FileText, Code, Mail, Bookmark, Calculator, Music, Brain, Sparkles, MessageSquare, GitBranch, Terminal, Lock, Key, Shuffle, RotateCcw, RefreshCw, Calendar, Users, Folder, Archive, Scissors } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";

// アクション定義
interface ClipboardAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  execute: (content: string) => void;
  condition?: (content: string, type: string) => boolean;
  priority?: number; // 数値が小さいほど優先度が高い
  keywords?: string[]; // 検索用キーワード
}

const clipboardActions: ClipboardAction[] = [
  // 基本アクション (優先度 1-3)
  {
    id: 'copy',
    label: 'クリップボードにコピー',
    icon: Copy,
    priority: 1,
    keywords: ['copy', 'コピー', 'clipboard'],
    execute: (content) => {
      navigator.clipboard.writeText(content);
      console.log('Copied to clipboard:', content);
    }
  },
  {
    id: 'search',
    label: 'Web検索',
    icon: Search,
    priority: 2,
    keywords: ['search', '検索', 'google', 'web'],
    execute: (content) => {
      const query = content.length > 100 ? content.substring(0, 100) + '...' : content;
      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
  },
  {
    id: 'translate',
    label: '翻訳',
    icon: Languages,
    priority: 3,
    keywords: ['translate', '翻訳', 'language', '言語'],
    execute: (content) => {
      window.open(`https://translate.google.com/?text=${encodeURIComponent(content)}`, '_blank');
    }
  },

  // AI関連 (優先度 4-6)
  {
    id: 'chatgpt',
    label: 'ChatGPTに送信',
    icon: Bot,
    priority: 4,
    keywords: ['chatgpt', 'ai', 'gpt', 'openai', '人工知能'],
    execute: (content) => {
      window.open(`https://chat.openai.com/?q=${encodeURIComponent(content)}`, '_blank');
    }
  },
  {
    id: 'claude',
    label: 'Claudeに送信',
    icon: Brain,
    priority: 5,
    keywords: ['claude', 'ai', 'anthropic', '人工知能'],
    execute: (content) => {
      window.open(`https://claude.ai/?q=${encodeURIComponent(content)}`, '_blank');
    }
  },
  {
    id: 'summarize',
    label: 'AI要約',
    icon: Sparkles,
    priority: 6,
    keywords: ['summarize', '要約', 'summary', 'ai'],
    execute: (content) => {
      console.log('AI Summarize:', content);
    }
  },

  // Web・URL関連 (優先度 7-10)
  {
    id: 'open-url',
    label: 'URLを開く',
    icon: ExternalLink,
    priority: 2,
    keywords: ['url', 'open', '開く', 'link', 'リンク'],
    execute: (content) => {
      window.open(content, '_blank');
    },
    condition: (content, type) => type === 'url' || /^https?:\/\//.test(content)
  },
  {
    id: 'qr-code',
    label: 'QRコード生成',
    icon: QrCode,
    priority: 8,
    keywords: ['qr', 'qrcode', 'barcode', 'code'],
    execute: (content) => {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(content)}`, '_blank');
    }
  },
  {
    id: 'shorten-url',
    label: 'URL短縮',
    icon: Scissors,
    priority: 9,
    keywords: ['shorten', 'short', '短縮', 'url'],
    execute: (content) => {
      console.log('Shorten URL:', content);
    },
    condition: (content, type) => type === 'url' || /^https?:\/\//.test(content)
  },

  // テキスト処理 (優先度 11-15)
  {
    id: 'edit',
    label: '編集',
    icon: Edit3,
    priority: 11,
    keywords: ['edit', '編集', 'modify', '変更'],
    execute: (content) => {
      console.log('Edit content:', content);
    }
  },
  {
    id: 'format-text',
    label: 'テキスト整形',
    icon: FileText,
    priority: 12,
    keywords: ['format', '整形', 'text', 'clean'],
    execute: (content) => {
      console.log('Format text:', content);
    }
  },
  {
    id: 'uppercase',
    label: '大文字に変換',
    icon: RotateCcw,
    priority: 13,
    keywords: ['uppercase', '大文字', 'caps', 'upper'],
    execute: (content) => {
      navigator.clipboard.writeText(content.toUpperCase());
    }
  },
  {
    id: 'lowercase',
    label: '小文字に変換',
    icon: RefreshCw,
    priority: 14,
    keywords: ['lowercase', '小文字', 'lower'],
    execute: (content) => {
      navigator.clipboard.writeText(content.toLowerCase());
    }
  },

  // コード関連 (優先度 16-20)
  {
    id: 'format-code',
    label: 'コード整形',
    icon: Code,
    priority: 16,
    keywords: ['code', 'format', 'コード', '整形', 'prettier'],
    execute: (content) => {
      console.log('Format code:', content);
    }
  },
  {
    id: 'run-code',
    label: 'コード実行',
    icon: Terminal,
    priority: 17,
    keywords: ['run', 'execute', '実行', 'code'],
    execute: (content) => {
      console.log('Run code:', content);
    }
  },
  {
    id: 'github-gist',
    label: 'GitHub Gistで共有',
    icon: GitBranch,
    priority: 18,
    keywords: ['github', 'gist', 'share', '共有'],
    execute: (content) => {
      window.open('https://gist.github.com/', '_blank');
    }
  },

  // メール・メッセージ (優先度 21-25)
  {
    id: 'send-email',
    label: 'メール送信',
    icon: Mail,
    priority: 21,
    keywords: ['email', 'mail', 'メール', '送信'],
    execute: (content) => {
      window.open(`mailto:?body=${encodeURIComponent(content)}`, '_blank');
    }
  },
  {
    id: 'share-slack',
    label: 'Slackで共有',
    icon: MessageSquare,
    priority: 22,
    keywords: ['slack', 'share', '共有', 'message'],
    execute: (content) => {
      console.log('Share to Slack:', content);
    }
  },
  {
    id: 'share-discord',
    label: 'Discordで共有',
    icon: Users,
    priority: 23,
    keywords: ['discord', 'share', '共有'],
    execute: (content) => {
      console.log('Share to Discord:', content);
    }
  },

  // 変換・計算 (優先度 26-30)
  {
    id: 'calculate',
    label: '計算実行',
    icon: Calculator,
    priority: 26,
    keywords: ['calculate', '計算', 'math', '数学'],
    execute: (content) => {
      try {
        const result = eval(content);
        navigator.clipboard.writeText(String(result));
        console.log('Calculation result:', result);
      } catch (e) {
        console.error('Invalid calculation');
      }
    }
  },
  {
    id: 'base64-encode',
    label: 'Base64エンコード',
    icon: Lock,
    priority: 27,
    keywords: ['base64', 'encode', 'エンコード'],
    execute: (content) => {
      const encoded = btoa(content);
      navigator.clipboard.writeText(encoded);
    }
  },
  {
    id: 'base64-decode',
    label: 'Base64デコード',
    icon: Key,
    priority: 28,
    keywords: ['base64', 'decode', 'デコード'],
    execute: (content) => {
      try {
        const decoded = atob(content);
        navigator.clipboard.writeText(decoded);
      } catch (e) {
        console.error('Invalid base64');
      }
    }
  },

  // ブックマーク・保存 (優先度 31-35)
  {
    id: 'bookmark',
    label: 'ブックマーク追加',
    icon: Bookmark,
    priority: 31,
    keywords: ['bookmark', 'save', '保存', 'favorite'],
    execute: (content) => {
      console.log('Add bookmark:', content);
    }
  },
  {
    id: 'save-note',
    label: 'ノートに保存',
    icon: FileText,
    priority: 32,
    keywords: ['note', 'save', '保存', 'memo'],
    execute: (content) => {
      console.log('Save note:', content);
    }
  },
  {
    id: 'add-calendar',
    label: 'カレンダーに追加',
    icon: Calendar,
    priority: 33,
    keywords: ['calendar', 'schedule', 'カレンダー', '予定'],
    execute: (content) => {
      console.log('Add to calendar:', content);
    }
  },

  // ファイル関連 (優先度 36-40)
  {
    id: 'save-file',
    label: 'ファイルに保存',
    icon: Folder,
    priority: 36,
    keywords: ['file', 'save', 'ファイル', '保存'],
    execute: (content) => {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clipboard.txt';
      a.click();
    }
  },
  {
    id: 'compress',
    label: '圧縮',
    icon: Archive,
    priority: 37,
    keywords: ['compress', 'zip', '圧縮'],
    execute: (content) => {
      console.log('Compress:', content);
    }
  },

  // その他のユーティリティ (優先度 41-50)
  {
    id: 'random-password',
    label: 'パスワード生成',
    icon: Shuffle,
    priority: 41,
    keywords: ['password', 'random', 'パスワード', '生成'],
    execute: (content) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      const password = Array.from({length: 12}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      navigator.clipboard.writeText(password);
    }
  },
  {
    id: 'word-count',
    label: '文字数カウント',
    icon: Hash,
    priority: 42,
    keywords: ['count', 'words', '文字数', 'カウント'],
    execute: (content) => {
      alert(`文字数: ${content.length}文字\n単語数: ${content.split(/\s+/).length}語`);
    }
  },
  {
    id: 'text-to-speech',
    label: '音声読み上げ',
    icon: Music,
    priority: 43,
    keywords: ['speech', 'voice', '音声', '読み上げ'],
    execute: (content) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(content);
        speechSynthesis.speak(utterance);
      }
    }
  },
  {
    id: 'reverse-text',
    label: 'テキスト反転',
    icon: Shuffle,
    priority: 44,
    keywords: ['reverse', '反転', 'flip'],
    execute: (content) => {
      navigator.clipboard.writeText(content.split('').reverse().join(''));
    }
  },
  {
    id: 'remove-spaces',
    label: 'スペース削除',
    icon: Scissors,
    priority: 45,
    keywords: ['space', 'remove', 'スペース', '削除', 'trim'],
    execute: (content) => {
      navigator.clipboard.writeText(content.replace(/\s+/g, ''));
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
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionIndex, setSelectedActionIndex] = useState(0);
  const [showAllActions, setShowAllActions] = useState(false);

  // メニュー位置を調整する関数
  const calculateMenuPosition = (clientX: number, clientY: number) => {
    const padding = 8; // 画面端からの余白
    
    // メニューが実際にレンダリングされている場合はその実際のサイズを使用
    let menuWidth = 160; // フォールバック値
    let menuHeight = 160; // フォールバック値
    
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      menuWidth = rect.width;
      menuHeight = rect.height;
    }
    
    let x = clientX;
    let y = clientY;
    
    // 右端を超える場合は左側に表示
    if (x + menuWidth > window.innerWidth - padding) {
      x = clientX - menuWidth;
    }
    
    // 下端を超える場合は上側に表示
    if (y + menuHeight > window.innerHeight - padding) {
      y = clientY - menuHeight;
    }
    
    // 左端を超える場合は右端に合わせる
    if (x < padding) {
      x = padding;
    }
    
    // 上端を超える場合は上端に合わせる
    if (y < padding) {
      y = padding;
    }
    
    return { x, y };
  };

  // コンテキストメニューを開く
  const handleContextMenu = (e: React.MouseEvent, item: typeof mockClipboardItems[0]) => {
    e.preventDefault();
    
    // 既にメニューが開いている場合は一旦閉じて、新しい位置で開く
    if (contextMenu.visible) {
      setContextMenu({ visible: false, x: 0, y: 0, item: null });
      // 少し遅延させて新しいメニューを開く
      setTimeout(() => {
        const { x, y } = calculateMenuPosition(e.clientX, e.clientY);
        setContextMenu({
          visible: true,
          x,
          y,
          item
        });
      }, 50);
    } else {
      // 初回は仮の位置でメニューを表示
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        item
      });
      
      // 次のフレームで実際のサイズを測定して位置を調整
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

  // アクションを実行
  const executeAction = (action: ClipboardAction, item: typeof mockClipboardItems[0]) => {
    action.execute(item.content);
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
    // 条件フィルタリング
    const availableActions = clipboardActions.filter(action => 
      !action.condition || action.condition(item.content, item.type)
    );

    // 検索クエリがある場合は検索フィルタリング
    const filteredActions = searchActions(availableActions, searchQuery);

    // 優先度順にソート
    const sortedActions = filteredActions.sort((a, b) => (a.priority || 999) - (b.priority || 999));

    // 検索中または「その他」表示中は全て表示
    if (searchQuery.trim() || showAllActions) {
      return {
        actions: sortedActions,
        hasMore: false,
        allActions: sortedActions
      };
    }

    // 通常時は上位3つ + "その他..."
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
        // メニューが開いている場合は閉じる
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
          {/* オーバーレイ */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeContextMenu}
          />
          
          {/* メニュー */}
          <div 
            ref={menuRef}
            className="fixed z-50 bg-card text-card-foreground border border-border rounded-md shadow-lg py-1 min-w-40"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            {/* 検索ボックス */}
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

            {/* アクションリスト */}
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
                      onClick={() => setShowAllActions(true)}
                    >
                      その他のアクション...
                    </button>
                  )}
                </>
              );
            })()}
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