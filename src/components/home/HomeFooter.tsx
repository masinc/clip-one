import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { ClipboardHook } from "@/hooks/useClipboard";
import type { DisplayClipboardItem } from "@/types/clipboardActions";

interface HomeFooterProps {
  clipboardItems: DisplayClipboardItem[];
  loading: boolean;
  clipboard: ClipboardHook;
  onHistoryReload: () => Promise<void>;
}

export function HomeFooter({ clipboardItems, loading, clipboard, onHistoryReload }: HomeFooterProps) {
  // 定期的に監視状態を同期（3秒間隔）
  useEffect(() => {
    const syncInterval = setInterval(() => {
      clipboard.syncMonitoringStatus().catch(console.error);
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [clipboard.syncMonitoringStatus]);
  const handleStartMonitoring = () => {
    clipboard
      .startMonitoring((newText: string) => {
        console.log("🔄 手動監視: クリップボード変更検出:", newText.substring(0, 50));
        // 少し遅延してUI更新（データベース保存の完了を待つ）
        setTimeout(() => {
          onHistoryReload().catch(console.error);
        }, 100);
      })
      .catch((err) => {
        console.error("手動監視開始エラー:", err);
      });
  };

  return (
    <div className="flex-shrink-0 border-t bg-card p-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onHistoryReload} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
            更新
          </Button>
          <div className="flex items-center gap-1 text-xs">
            <span className={`w-2 h-2 rounded-full ${clipboard.isMonitoring ? "bg-green-500" : "bg-red-500"}`}></span>
            <span className="text-muted-foreground">{clipboard.isMonitoring ? "監視中" : "停止中"}</span>
            {!clipboard.isMonitoring && (
              <Button variant="outline" size="sm" className="ml-2 h-6 px-2 text-xs" onClick={handleStartMonitoring}>
                開始
              </Button>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground px-2 py-1">{clipboardItems.length}件</div>
      </div>
    </div>
  );
}
