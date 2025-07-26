import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft, Database, Download, Eye, Monitor, Moon, RotateCcw, Sun, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import type { AppSettings } from "@/types/clipboard";
import { autostartApi } from "@/utils/plugins";

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // 設定状態
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [maxHistoryInput, setMaxHistoryInput] = useState("1000");
  const [unlimitedHistory, setUnlimitedHistory] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 設定を読み込み
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // アプリ設定を読み込み
        const appSettings = await invoke<AppSettings>("get_app_settings");
        setSettings(appSettings);
        setMaxHistoryInput(appSettings.max_history_items.toString());
        setUnlimitedHistory(appSettings.max_history_items === 0);

        // OS自動起動状態を読み込み
        const autostartEnabled = await autostartApi.isEnabled();
        setAutoStart(autostartEnabled);

        console.log("設定読み込み完了:", { appSettings, autostartEnabled });
      } catch (error) {
        console.error("設定読み込みエラー:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 自動起動設定の変更
  const handleAutoStartChange = async (enabled: boolean) => {
    try {
      setSaving(true);
      if (enabled) {
        await autostartApi.enable();
      } else {
        await autostartApi.disable();
      }
      setAutoStart(enabled);
      console.log("自動起動設定変更:", enabled);
    } catch (error) {
      console.error("自動起動設定エラー:", error);
    } finally {
      setSaving(false);
    }
  };

  // 表示件数設定の変更
  const handleMaxHistoryChange = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const maxItems = unlimitedHistory ? 0 : parseInt(maxHistoryInput) || 1000;

      await invoke("update_setting", {
        key: "max_history_items",
        value: maxItems,
      });

      setSettings((prev) => (prev ? { ...prev, max_history_items: maxItems } : null));
      console.log("表示件数変更:", maxItems);
    } catch (error) {
      console.error("表示件数設定エラー:", error);
    } finally {
      setSaving(false);
    }
  };

  // 通知設定の変更
  const handleNotificationsChange = async (enabled: boolean) => {
    if (!settings) return;

    try {
      setSaving(true);
      await invoke("update_setting", {
        key: "notifications_enabled",
        value: enabled,
      });

      setSettings((prev) => (prev ? { ...prev, notifications_enabled: enabled } : null));
      console.log("通知設定変更:", enabled);
    } catch (error) {
      console.error("通知設定エラー:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">設定を読み込み中...</div>
        </div>
      </div>
    );
  }

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

            <div className="space-y-3">
              <Label>表示件数</Label>
              <div className="flex items-center space-x-3">
                <Switch
                  checked={unlimitedHistory}
                  onCheckedChange={(checked) => {
                    setUnlimitedHistory(checked);
                    if (checked) {
                      handleMaxHistoryChange();
                    }
                  }}
                  disabled={saving}
                />
                <Label className="text-sm">無制限</Label>
              </div>
              {!unlimitedHistory && (
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={maxHistoryInput}
                    onChange={(e) => setMaxHistoryInput(e.target.value)}
                    onBlur={handleMaxHistoryChange}
                    min="1"
                    max="10000"
                    className="w-32"
                    disabled={saving}
                  />
                  <span className="text-sm text-muted-foreground">件</span>
                </div>
              )}
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
                <div className="text-sm text-muted-foreground">
                  システム起動時に自動的にアプリを開始します（OS設定と連携）
                </div>
              </div>
              <Switch checked={autoStart} onCheckedChange={handleAutoStartChange} disabled={saving} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>通知</Label>
                <div className="text-sm text-muted-foreground">新しいクリップボード項目の通知を表示します</div>
              </div>
              <Switch
                checked={settings?.notifications_enabled ?? false}
                onCheckedChange={handleNotificationsChange}
                disabled={saving}
              />
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
      </div>
    </div>
  );
};

export default Settings;
