import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Clock, Hash, MoreHorizontal } from "lucide-react";

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
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* ヘッダー */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold">ClipOne</h1>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Input 
            placeholder="履歴を検索..." 
            className="h-8"
          />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-2">
            {mockClipboardItems.map((item, index) => (
              <Card key={item.id} className="mb-1 p-0 hover:bg-muted/30 cursor-pointer transition-colors">
                <div className="p-3">
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
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* フッター */}
      <div className="flex-shrink-0 border-t bg-card p-2">
        <div className="flex gap-1">
          <Button size="sm" variant="outline">クリア</Button>
          <Button size="sm" variant="outline">エクスポート</Button>
          <div className="ml-auto text-xs text-muted-foreground px-2 py-1">
            {mockClipboardItems.length}件
          </div>
        </div>
      </div>
    </div>
  );
}