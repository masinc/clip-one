import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface StateViewProps {
  onHistoryReload: () => Promise<void>;
}

export function ErrorView({ error, onHistoryReload }: { error: string } & StateViewProps) {
  const handleAddTestData = async () => {
    try {
      const result = await invoke("add_test_data");
      console.log("テストデータ追加結果:", result);
      await onHistoryReload();
    } catch (err) {
      console.error("テストデータ追加エラー:", err);
    }
  };

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

export function LoadingView() {
  return (
    <div className="p-2">
      <Card className="mb-2 p-3">
        <p className="text-sm text-muted-foreground">履歴を読み込み中...</p>
      </Card>
    </div>
  );
}

export function EmptyView({ onHistoryReload }: StateViewProps) {
  const handleAddTestData = async () => {
    try {
      const result = await invoke("add_test_data");
      console.log("テストデータ追加結果:", result);
      await onHistoryReload();
    } catch (err) {
      console.error("テストデータ追加エラー:", err);
    }
  };

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