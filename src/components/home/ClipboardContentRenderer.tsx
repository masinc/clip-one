import { openUrl } from "@tauri-apps/plugin-opener";
import { useClipboardControl } from "@/hooks/useClipboardControl";
import { useImageWindow } from "@/hooks/useImageWindow";
import { parseFileList, truncateText } from "@/utils/textUtils";

interface ClipboardContentRendererProps {
  format: string;
  content: string;
  isExpanded: boolean;
}

export function ClipboardContentRenderer({ format, content, isExpanded }: ClipboardContentRendererProps) {
  const { showImageWindow } = useImageWindow();
  const { notifyStartCopy } = useClipboardControl();

  const shouldTruncate = content.length > 100;
  const displayContent = isExpanded || !shouldTruncate ? content : truncateText(content);

  // URL表示 - クリック可能なリンク
  if (format === "text/uri-list") {
    return (
      <div className="text-sm">
        <div
          className="text-blue-500 hover:text-blue-700 underline break-words cursor-pointer text-left w-full"
          onClick={async (e) => {
            e.stopPropagation();
            // URL開く際の通知（URLがクリップボードにコピーされる可能性があるため）
            await notifyStartCopy(content.trim(), "url-open");
            try {
              await openUrl(content.trim());
            } catch (error) {
              console.error("URL開く失敗:", error);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.currentTarget.click();
            }
          }}
          role="button"
          tabIndex={0}
          title={`${content} を外部ブラウザで開く`}
        >
          {displayContent}
        </div>
      </div>
    );
  }

  // ファイルリスト表示 - アイコン付きリスト
  if (format === "application/x-file-list") {
    const fileList = parseFileList(content);
    const displayFiles = isExpanded ? fileList : fileList.slice(0, 3);

    return (
      <div className="text-sm space-y-1">
        {displayFiles.map((file, i) => (
          <div key={`${file.filename}-${i}`} className="flex items-center gap-2">
            <span className="text-base">{file.icon}</span>
            <span className="break-words">{file.filename}</span>
          </div>
        ))}
        {!isExpanded && fileList.length > 3 && (
          <div className="text-xs text-muted-foreground">+{fileList.length - 3}個のファイル...</div>
        )}
      </div>
    );
  }

  // 画像表示
  if (format === "image/png") {
    return (
      <div className="text-sm">
        {content.startsWith("data:image/") ? (
          <div className="space-y-2">
            <img
              src={content}
              alt="クリップボード画像"
              className="max-w-full max-h-48 rounded border object-contain bg-muted cursor-pointer transition-all hover:opacity-80"
              onClick={(e) => {
                e.stopPropagation();
                console.log(
                  "🖼️ 画像クリック - クリック位置表示:",
                  format,
                  "データ長:",
                  content.length,
                  "位置:",
                  e.screenX,
                  e.screenY,
                );
                showImageWindow(content, e);
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
                  showImageWindow(content, centerEvent);
                }
              }}
              onError={(e) => {
                console.error("画像表示エラー:", e);
                e.currentTarget.style.display = "none";
              }}
              title="クリックで別ウィンドウ表示"
            />
            <p className="text-xs text-muted-foreground">画像データ ({Math.round(content.length / 1024)}KB)</p>
          </div>
        ) : (
          <p className="text-muted-foreground">{displayContent}</p>
        )}
      </div>
    );
  }

  // 通常のテキスト表示
  return <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{displayContent}</p>;
}
