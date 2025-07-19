import {
  ArrowLeft,
  Database,
  Download,
  Eye,
  FileText,
  Monitor,
  Moon,
  RotateCcw,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [autoStart, setAutoStart] = useState(true);
  const [maxHistory, setMaxHistory] = useState("1000");
  const [showPreview, setShowPreview] = useState(true);
  const [notifications, setNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">設定</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* テーマ設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              テーマ
            </CardTitle>
            <CardDescription>アプリの外観を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>カラーテーマ</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      ライト
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      ダーク
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      システム設定に従う
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 表示設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              表示設定
            </CardTitle>
            <CardDescription>クリップボード履歴の表示方法を設定します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>プレビュー表示</Label>
                <div className="text-sm text-muted-foreground">テキストの先頭部分をプレビューします</div>
              </div>
              <Switch checked={showPreview} onCheckedChange={setShowPreview} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>表示件数</Label>
              <Select value={maxHistory} onValueChange={setMaxHistory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100件</SelectItem>
                  <SelectItem value="500">500件</SelectItem>
                  <SelectItem value="1000">1000件</SelectItem>
                  <SelectItem value="5000">5000件</SelectItem>
                  <SelectItem value="unlimited">無制限</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* アプリ設定 */}
        <Card>
          <CardHeader>
            <CardTitle>アプリケーション設定</CardTitle>
            <CardDescription>アプリの動作に関する設定</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>スタートアップ時に起動</Label>
                <div className="text-sm text-muted-foreground">システム起動時に自動的にアプリを開始します</div>
              </div>
              <Switch checked={autoStart} onCheckedChange={setAutoStart} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>通知</Label>
                <div className="text-sm text-muted-foreground">新しいクリップボード項目の通知を表示します</div>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>

        {/* データ管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              データ管理
            </CardTitle>
            <CardDescription>クリップボード履歴データの管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto p-4">
                <div className="flex flex-col items-center gap-2">
                  <Download className="h-5 w-5" />
                  <span className="text-sm">エクスポート</span>
                </div>
              </Button>

              <Button variant="outline" className="h-auto p-4">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5" />
                  <span className="text-sm">インポート</span>
                </div>
              </Button>
            </div>

            <Separator />

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm("すべての履歴を削除しますか？この操作は取り消せません。")) {
                    // TODO: 履歴削除処理
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                すべての履歴を削除
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm("設定をリセットしますか？")) {
                    // TODO: 設定リセット処理
                  }
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                設定をリセット
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* アプリ情報 */}
        <Card>
          <CardHeader>
            <CardTitle>アプリ情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">バージョン</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ビルド</span>
              <span>2024.12.21</span>
            </div>
            <Separator className="my-3" />
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              ライセンス情報
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
