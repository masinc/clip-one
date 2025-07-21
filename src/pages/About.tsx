import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { ArrowLeft, Code, FileText, Github, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AppInfo } from "@/types/clipboard";

const About = () => {
  const navigate = useNavigate();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // アプリ情報を取得
  useEffect(() => {
    const loadAppInfo = async () => {
      try {
        const info = await invoke<AppInfo>("get_app_info");
        setAppInfo(info);
      } catch (error) {
        console.error("アプリ情報の取得に失敗:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAppInfo();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">アプリ情報を読み込み中...</p>
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
          <h1 className="text-lg font-semibold">ClipOne について</h1>
        </div>
      </div>

      {/* About Content */}
      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        {/* アプリロゴ・タイトル */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary-foreground">C</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{appInfo?.name || "ClipOne"}</h2>
                <p className="text-muted-foreground">
                  {appInfo?.description || "クリップボード履歴管理アプリケーション"}
                </p>
              </div>
              <div className="flex justify-center">
                <Badge variant="secondary" className="text-sm">
                  Version {appInfo?.version || "0.0.0"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アプリ詳細情報 */}
        <Card>
          <CardHeader>
            <CardTitle>アプリケーション情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">アプリ名</span>
                <span className="font-medium">{appInfo?.name || "ClipOne"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">バージョン</span>
                <span className="font-medium">{appInfo?.version || "0.0.0"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">作者</span>
                <span className="font-medium">{appInfo?.author || "Unknown"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ビルド日</span>
                <span className="font-medium">{appInfo?.build_date || "Unknown"}</span>
              </div>
              {appInfo?.license && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ライセンス</span>
                  <span className="font-medium">{appInfo.license}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 技術スタック */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              技術スタック
            </CardTitle>
            <CardDescription>ClipOneの構築に使用された技術</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">フロントエンド</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• React 18</div>
                  <div>• TypeScript</div>
                  <div>• Tailwind CSS</div>
                  <div>• shadcn/ui</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">バックエンド</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>• Tauri v2</div>
                  <div>• Rust</div>
                  <div>• SQLite</div>
                  <div>• clipboard-rs</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 機能紹介 */}
        <Card>
          <CardHeader>
            <CardTitle>主な機能</CardTitle>
            <CardDescription>ClipOneで利用できる機能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>クリップボード履歴管理</strong>
                  <div className="text-muted-foreground">コピーした内容を自動的に保存し、履歴から簡単に再利用</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>システムトレイ常駐</strong>
                  <div className="text-muted-foreground">バックグラウンドで動作し、必要な時にすぐアクセス可能</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>複数形式対応</strong>
                  <div className="text-muted-foreground">テキスト、画像、ファイルなど多様な形式をサポート</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>検索・フィルタ</strong>
                  <div className="text-muted-foreground">履歴の検索と絞り込みで効率的な履歴管理</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* リンク集 */}
        <Card>
          <CardHeader>
            <CardTitle>関連リンク</CardTitle>
          </CardHeader>
          <CardContent>
            {appInfo?.repository && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={async () => {
                  if (appInfo?.repository) {
                    try {
                      await openUrl(appInfo.repository);
                    } catch (error) {
                      console.error("リポジトリを開けませんでした:", error);
                    }
                  }
                }}
              >
                <Github className="h-4 w-4 mr-2" />
                GitHub リポジトリ
              </Button>
            )}
          </CardContent>
        </Card>

        {/* フッター */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                <span>Made with</span>
                <Heart className="h-4 w-4 text-red-500" />
                <span>by {appInfo?.author || "Unknown"}</span>
              </div>
              <p className="text-xs text-muted-foreground">© 2024 ClipOne. すべての権利は留保されています。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
