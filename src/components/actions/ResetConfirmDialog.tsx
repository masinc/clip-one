import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw as Reset } from 'lucide-react';

interface ResetConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ResetConfirmDialog({ isOpen, onConfirm, onCancel }: ResetConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/50" 
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">設定をリセット</CardTitle>
            <CardDescription>
              すべてのアクション設定をデフォルトに戻します。<br/>
              カスタムアクションは削除され、この操作は元に戻せません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onCancel}
                size="sm"
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                onClick={onConfirm}
                size="sm"
              >
                <Reset className="h-4 w-4 mr-2" />
                リセット実行
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}