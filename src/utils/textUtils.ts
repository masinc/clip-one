/**
 * テキストを指定された長さで切り詰める
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * コンテンツタイプに応じたアイコンを取得
 */
export function getTypeIcon(type: string): string {
  switch (type) {
    case "text/html":
      return "🌐";
    case "text/rtf":
      return "📝";
    case "text/uri-list":
      return "🔗";
    case "image/png":
    case "image/jpeg":
    case "image/gif":
      return "🖼️";
    case "application/x-file-list":
      return "📁";
    case "application/x-file-path":
      return "📄";
    default:
      return "📄";
  }
}

/**
 * コンテンツタイプに応じた表示名を取得
 */
export function getTypeName(type: string): string {
  switch (type) {
    case "text/html":
      return "HTML";
    case "text/rtf":
      return "リッチテキスト";
    case "text/uri-list":
      return "URL";
    case "image/png":
    case "image/jpeg":
    case "image/gif":
      return "画像";
    case "application/x-file-list":
      return "ファイルリスト";
    case "application/x-file-path":
      return "ファイルパス";
    default:
      return "テキスト";
  }
}

/**
 * ファイル拡張子に応じた絵文字アイコンを取得
 */
export function getFileIcon(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop() || "";

  switch (ext) {
    // ドキュメント
    case "doc":
    case "docx":
    case "txt":
    case "rtf":
      return "📄";

    // スプレッドシート
    case "xls":
    case "xlsx":
    case "csv":
      return "📊";

    // プレゼンテーション
    case "ppt":
    case "pptx":
      return "📋";

    // PDF
    case "pdf":
      return "📕";

    // 画像
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
    case "svg":
    case "webp":
      return "🖼️";

    // 音声
    case "mp3":
    case "wav":
    case "flac":
    case "aac":
    case "m4a":
      return "🎵";

    // 動画
    case "mp4":
    case "avi":
    case "mkv":
    case "mov":
    case "wmv":
    case "webm":
      return "🎬";

    // アーカイブ
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return "📦";

    // プログラム
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
    case "html":
    case "css":
    case "py":
    case "java":
    case "c":
    case "cpp":
    case "rs":
    case "go":
      return "💻";

    // 実行ファイル
    case "exe":
    case "msi":
    case "dmg":
    case "deb":
    case "rpm":
      return "⚙️";

    // デフォルト
    default:
      return "📁";
  }
}

/**
 * ファイルリストテキストを解析してファイル情報を取得
 */
export function parseFileList(fileListText: string): Array<{ filename: string; icon: string }> {
  const lines = fileListText.split("\n").filter((line) => line.trim());

  return lines.map((line) => {
    // ファイルパスからファイル名を抽出
    const filename = line.split(/[\\/]/).pop() || line;
    return {
      filename: filename.trim(),
      icon: getFileIcon(filename),
    };
  });
}
