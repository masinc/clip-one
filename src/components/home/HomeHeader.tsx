import { invoke } from "@tauri-apps/api/core";
import { Archive, Info, MoreHorizontal, Settings, Sliders } from "lucide-react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HomeHeaderProps {
  onHistoryReload: () => Promise<void>;
}

export function HomeHeader({ onHistoryReload }: HomeHeaderProps) {
  const navigate = useNavigate();

  const handleClearHistory = async () => {
    if (confirm("すべての履歴を削除しますか？この操作は取り消せません。")) {
      console.log("履歴クリア開始...");
      try {
        await invoke("clear_clipboard_history");
        console.log("履歴クリア完了");
        await onHistoryReload();
      } catch (err) {
        console.error("履歴クリアエラー:", err);
      }
    }
  };

  return (
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
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4" />
                  設定
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/actions-settings")}>
                  <Sliders className="h-4 w-4" />
                  アクション設定
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleClearHistory}>
                  <Archive className="h-4 w-4" />
                  履歴をクリア
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
  );
}
