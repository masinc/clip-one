import { invoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Clock, Copy, Hash } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormatBadges } from "@/components/ui/format-badges";
import type { DisplayClipboardItem } from "@/types/clipboardActions";
import { formatRelativeTime } from "@/utils/dateUtils";
import { getTypeIcon, getTypeName, parseFileList, truncateText } from "@/utils/textUtils";

interface ClipboardItemListProps {
  clipboardItems: DisplayClipboardItem[];
  loading: boolean;
  error: string | null;
  expandedItems: Set<string>;
  onItemClick: (itemId: string) => void;
  onHistoryReload: () => Promise<void>;
  onContextMenu: (e: React.MouseEvent, item: DisplayClipboardItem) => void;
}

export function ClipboardItemList({
  clipboardItems,
  loading,
  error,
  expandedItems,
  onItemClick,
  onHistoryReload,
  onContextMenu,
}: ClipboardItemListProps) {
  // 各アイテムの選択された形式を管理
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string>>({});

  // 形式切り替えハンドラー
  const handleFormatChange = (itemId: string, format: string) => {
    setSelectedFormats((prev) => ({
      ...prev,
      [itemId]: format,
    }));
  };

  // アイテムの現在の形式とコンテンツを取得
  const getCurrentFormatAndContent = (item: DisplayClipboardItem) => {
    const selectedFormat = selectedFormats[item.id] || item.content_type;
    const content = item.format_contents?.[selectedFormat] || item.content;
    return { format: selectedFormat, content };
  };

  // 画像をクリック位置に表示
  const handleImageWindow = (imageData: string, clickEvent: React.MouseEvent) => {
    console.log("🖼️ 画像表示:", `${imageData.substring(0, 50)}...`);

    // 画像サイズを取得するための一時的なImage要素を作成
    const tempImg = new Image();
    tempImg.onload = () => {
      const imgWidth = tempImg.width;
      const imgHeight = tempImg.height;

      // デスクトップサイズを取得
      const screenWidth = window.screen.availWidth;
      const screenHeight = window.screen.availHeight;

      // ウィンドウサイズを計算（画像サイズに合わせる、ただしデスクトップサイズを超える場合は縮小）
      let windowWidth = imgWidth;
      let windowHeight = imgHeight;

      // デスクトップサイズの90%を最大値とする
      const maxWidth = screenWidth * 0.9;
      const maxHeight = screenHeight * 0.9;

      // 縦横どちらかがデスクトップサイズを超える場合、アスペクト比を維持して縮小
      if (windowWidth > maxWidth || windowHeight > maxHeight) {
        const scaleWidth = maxWidth / windowWidth;
        const scaleHeight = maxHeight / windowHeight;
        const scale = Math.min(scaleWidth, scaleHeight); // より小さいスケールを選択

        windowWidth = windowWidth * scale;
        windowHeight = windowHeight * scale;
      }

      // クリック位置を基準とした表示位置を計算
      const clickX = clickEvent.screenX;
      const clickY = clickEvent.screenY;
      
      // ウィンドウがデスクトップ範囲外に出ないよう調整
      let windowX = clickX - windowWidth / 2; // クリック位置を中央とする
      let windowY = clickY - windowHeight / 2;
      
      // 画面境界チェック
      if (windowX < 0) windowX = 0;
      if (windowY < 0) windowY = 0;
      if (windowX + windowWidth > screenWidth) {
        windowX = screenWidth - windowWidth;
      }
      if (windowY + windowHeight > screenHeight) {
        windowY = screenHeight - windowHeight;
      }
      
      // 調整後もデスクトップ範囲外になる場合は中央表示にフォールバック
      if (windowX < 0 || windowY < 0) {
        windowX = (screenWidth - windowWidth) / 2;
        windowY = (screenHeight - windowHeight) / 2;
      }

      const newWindow = window.open(
        "",
        "_blank",
        `width=${Math.round(windowWidth)},height=${Math.round(windowHeight)},left=${Math.round(windowX)},top=${Math.round(windowY)},scrollbars=no,resizable=yes`,
      );
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>ClipOne - 画像表示</title>
            <style>
              body { 
                margin: 0; 
                background: #000; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh;
                overflow: hidden;
              }
              img { 
                max-width: 100vw; 
                max-height: 100vh; 
                object-fit: contain;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <img src="${imageData}" alt="クリップボード画像" onclick="window.close()" />
            <script>
              document.addEventListener('keydown', function(event) {
                if (event.key === 'Escape') {
                  window.close();
                }
              });
              
              document.addEventListener('click', function(event) {
                window.close();
              });
            </script>
          </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        console.error("❌ 別ウィンドウを開けませんでした（ポップアップブロックされた可能性があります）");
      }
    };

    tempImg.src = imageData;
  };

  const handleAddTestData = async () => {
    try {
      const result = await invoke("add_test_data");
      console.log("テストデータ追加結果:", result);
      await onHistoryReload();
    } catch (err) {
      console.error("テストデータ追加エラー:", err);
    }
  };

  if (error) {
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

  if (loading) {
    return (
      <div className="p-2">
        <Card className="mb-2 p-3">
          <p className="text-sm text-muted-foreground">履歴を読み込み中...</p>
        </Card>
      </div>
    );
  }

  if (clipboardItems.length === 0) {
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

  return (
    <div className="p-2 relative">
      {clipboardItems.map((item, index) => {
        const isExpanded = expandedItems.has(item.id);
        const { format: currentFormat, content: currentContent } = getCurrentFormatAndContent(item);
        const shouldTruncate = currentContent.length > 100;
        const displayContent = isExpanded || !shouldTruncate ? currentContent : truncateText(currentContent);

        return (
          <Card
            key={item.id}
            className="mb-1 p-3 hover:bg-accent hover:text-accent-foreground transition-colors border hover:border-accent-foreground/20 group"
            onContextMenu={(e) => onContextMenu(e, item)}
          >
            <div className="grid grid-cols-[auto_1fr_auto] gap-3 items-start">
              <div className="mt-0.5">
                <span className="text-xs">{getTypeIcon(currentFormat)}</span>
              </div>

              <button
                type="button"
                className="min-w-0 cursor-default text-left bg-transparent border-none p-0 w-full"
                onClick={() => onItemClick(item.id)}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatRelativeTime(item.timestamp)}
                  </div>
                  <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    {getTypeName(currentFormat)}
                  </span>
                </div>

                {/* 複数形式バッジ */}
                {item.available_formats && (
                  <FormatBadges
                    availableFormats={item.available_formats}
                    currentFormat={currentFormat}
                    onFormatChange={(format) => handleFormatChange(item.id, format)}
                    mainFormat={item.content_type}
                  />
                )}

                {/* コンテンツ表示 - 形式別の特殊表示 */}
                {currentFormat === "text/uri-list" ? (
                  // URL表示 - クリック可能なリンク
                  <div className="text-sm">
                    <button
                      type="button"
                      className="text-blue-500 hover:text-blue-700 underline break-words cursor-pointer text-left w-full"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await openUrl(currentContent.trim());
                        } catch (error) {
                          console.error("URL開く失敗:", error);
                        }
                      }}
                      title={`${currentContent} を外部ブラウザで開く`}
                    >
                      {displayContent}
                    </button>
                  </div>
                ) : currentFormat === "application/x-file-list" ? (
                  // ファイルリスト表示 - アイコン付きリスト
                  <div className="text-sm space-y-1">
                    {parseFileList(currentContent)
                      .slice(0, isExpanded ? undefined : 3)
                      .map((file, i) => (
                        <div key={`${file.filename}-${i}`} className="flex items-center gap-2">
                          <span className="text-base">{file.icon}</span>
                          <span className="break-words">{file.filename}</span>
                        </div>
                      ))}
                    {!isExpanded && parseFileList(currentContent).length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{parseFileList(currentContent).length - 3}個のファイル...
                      </div>
                    )}
                  </div>
                ) : currentFormat === "image/png" ? (
                  // 画像表示
                  <div className="text-sm">
                    {currentContent.startsWith("data:image/") ? (
                      <div className="space-y-2">
                        <img
                          src={currentContent}
                          alt="クリップボード画像"
                          className="max-w-full max-h-48 rounded border object-contain bg-muted cursor-pointer transition-all hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(
                              "🖼️ 画像クリック - クリック位置表示:",
                              currentFormat,
                              "データ長:",
                              currentContent.length,
                              "位置:",
                              e.screenX,
                              e.screenY
                            );
                            handleImageWindow(currentContent, e);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              // キーボード操作の場合は画面中央に表示
                              const centerEvent = {
                                screenX: window.screen.availWidth / 2,
                                screenY: window.screen.availHeight / 2,
                              } as React.MouseEvent;
                              handleImageWindow(currentContent, centerEvent);
                            }
                          }}
                          onError={(e) => {
                            console.error("画像表示エラー:", e);
                            e.currentTarget.style.display = "none";
                          }}
                          title="クリックで別ウィンドウ表示"
                        />
                        <p className="text-xs text-muted-foreground">
                          画像データ ({Math.round(currentContent.length / 1024)}KB)
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">{displayContent}</p>
                    )}
                  </div>
                ) : (
                  // 通常のテキスト表示
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{displayContent}</p>
                )}
              </button>

              <div className="ml-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-accent transition-opacity cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(currentContent);
                  }}
                  title="クリップボードにコピー"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
