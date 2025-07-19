# ClipOne - 技術アーキテクチャ

## 1. システム概要

ClipOneは、クリップボード操作に特化したTauriフレームワーク上に構築されたデスクトップアプリケーションです。ReactフロントエンドとRustバックエンドを組み合わせ、最適なパフォーマンスとネイティブOS統合を実現します。モダンなUIライブラリとルーティングシステムを活用し、優れたユーザー体験を提供します。

```
┌─────────────────────────────────────────────────────────────────┐
│                         ユーザーインターフェース                │
│                    (React + TypeScript)                        │
├─────────────────────────────────────────────────────────────────┤
│                      アプリケーションロジック                   │
│                         (Tauri Core)                           │
├─────────────────────────────────────────────────────────────────┤
│                      バックエンドサービス                       │
│                         (Rust)                                 │
├─────────────────────────────────────────────────────────────────┤
│           ローカルストレージ         │    システム統合           │
│          (SQLite データベース)         │   (クリップボード)         │
└─────────────────────────────────────────────────────────────────┘
```

## 2. フロントエンドアーキテクチャ (React + TypeScript)

### 2.0 技術スタック

- **React 18** - UIフレームワーク
- **TypeScript** - 型安全な開発
- **React Router v7** - データローダー付きルーティング
- **Tailwind CSS** - ユーティリティファーストCSS
- **shadcn/ui** - 再利用可能なUIコンポーネント
- **Vite** - 高速ビルドツール
- **Biome** - 高速なリンター・フォーマッター

### 2.1 コンポーネント構造

```
src/
├── components/           # 再利用可能なUIコンポーネント
│   ├── common/          # 汎用コンポーネント (Button, Input等)
│   ├── clipboard/       # クリップボード専用コンポーネント
│   ├── history/         # 履歴管理コンポーネント
│   └── settings/        # 設定コンポーネント
├── pages/               # ルートレベルコンポーネント
│   ├── Home.tsx         # メインクリップボードインターフェース
│   ├── History.tsx      # クリップボード履歴ビュー
│   └── Settings.tsx     # アプリケーション設定
├── hooks/               # カスタムReactフック
│   ├── useClipboard.ts      # クリップボード統合
│   ├── useHistory.ts        # 履歴管理
│   ├── useSettings.ts       # 設定管理
│   └── useDatabase.ts       # データベース操作
├── types/               # TypeScript定義
│   ├── clipboard.ts     # クリップボード関連の型
│   ├── history.ts       # 履歴データ型
│   ├── database.ts      # データベーススキーマ型
│   └── settings.ts      # 設定スキーマ型
├── utils/               # ユーティリティ関数
│   ├── database.ts      # データベースヘルパー
│   ├── validation.ts    # 入力検証
│   └── formatters.ts    # テキスト整形ヘルパー
└── stores/              # 状態管理
    ├── clipboardStore.ts    # クリップボード状態
    ├── settingsStore.ts     # アプリケーション設定
    └── historyStore.ts      # 履歴管理
```

### 2.2 UI コンポーネント設計

#### shadcn/ui + Tailwind CSS統合

```typescript
// shadcn/ui ベースコンポーネント
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

// カスタムコンポーネント例
const ClipboardItem = ({ item }: { item: ClipboardItem }) => (
  <Card className="mb-2 hover:bg-muted/50 transition-colors">
    <CardContent className="p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm truncate flex-1">{item.content}</p>
        <Badge variant="secondary" className="ml-2">
          {formatTime(item.timestamp)}
        </Badge>
      </div>
    </CardContent>
  </Card>
);
```

### 2.3 React Router v7 データローディング

```typescript
// ルート定義とデータローダー
export const routes: RouteObject[] = [
  {
    path: "/",
    Component: HomeLayout,
    loader: homeLoader,
    children: [
      {
        index: true,
        Component: ClipboardHistory,
        loader: historyLoader,
      },
      {
        path: "settings",
        Component: Settings,
        loader: settingsLoader,
      },
    ],
  },
];

// データローダー例
export async function historyLoader(): Promise<ClipboardItem[]> {
  return await invoke("get_clipboard_history", { limit: 100 });
}

export async function settingsLoader(): Promise<AppSettings> {
  return await invoke("get_app_settings");
}
```

### 2.4 状態管理パターン

状態管理にはReact Context + Reducersを使用:

```typescript
// クリップボードコンテキスト
interface ClipboardState {
  currentText: string;
  history: ClipboardItem[];
  isWatching: boolean;
  error: string | null;
}

// 設定コンテキスト
interface SettingsState {
  autoStart: boolean;
  maxHistoryItems: number;
  hotkeys: Record<string, string>;
  theme: "light" | "dark";
}
```

## 3. バックエンドアーキテクチャ (Rust + Tauri)

### 3.0 技術スタック

- **Tauri v2** - デスクトップアプリフレームワーク
- **Rust 1.77.2+** - システムプログラミング言語
- **SQLx** - 非同期SQLiteドライバー
- **CrossCopy/tauri-plugin-clipboard** - クリップボード統合
- **Serde** - シリアライゼーション
- **Tokio** - 非同期ランタイム

### 3.1 Tauriコマンド構造

```rust
// src-tauri/src/commands/
mod clipboard;    // クリップボード操作コマンド
mod history;      // 履歴管理
mod database;     // データベース操作
mod settings;     // 設定管理

// メインコマンドエクスポート
pub use clipboard::*;
pub use history::*;
pub use database::*;
pub use settings::*;
```

### 3.2 コアサービス

#### クリップボードサービス (CrossCopy/tauri-plugin-clipboard統合)

```rust
use tauri_plugin_clipboard::ClipboardExt;

#[tauri::command]
pub async fn get_clipboard_text(app: tauri::AppHandle) -> Result<String, String> {
    app.clipboard()
        .read_text()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn set_clipboard_text(app: tauri::AppHandle, text: String) -> Result<(), String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_clipboard_monitoring(app: tauri::AppHandle) -> Result<(), String> {
    // CrossCopyプラグインでクリップボード監視を開始
    app.clipboard_manager()
        .start_monitoring()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn stop_clipboard_monitoring(app: tauri::AppHandle) -> Result<(), String> {
    // クリップボード監視を停止
    app.clipboard_manager()
        .stop_monitoring()
        .map_err(|e| e.to_string())
}

// フロントエンドでのイベント処理例
// (TypeScript側)
/*
import { 
  onTextUpdate, 
  startListening,
  readText,
  writeText 
} from 'tauri-plugin-clipboard-api'

// 監視開始
const unlistenClipboard = await startListening()

// テキスト変更監視
const unlistenText = await onTextUpdate((newText) => {
  // 新しいテキストをデータベースに保存
  invoke('save_clipboard_item', {
    content: newText,
    contentType: 'text/plain',
    timestamp: Date.now()
  })
})
*/
```

#### 履歴管理サービス

```rust
#[derive(serde::Serialize, serde::Deserialize)]
pub struct ClipboardItem {
    pub id: String,
    pub content: String,
    pub timestamp: i64,
    pub content_type: String,
    pub is_favorite: bool,
}

#[tauri::command]
pub async fn save_clipboard_item(item: ClipboardItem) -> Result<(), String> {
    // SQLiteデータベースに履歴アイテムを保存
}

#[tauri::command]
pub async fn get_history(limit: Option<usize>, offset: Option<usize>) -> Result<Vec<ClipboardItem>, String> {
    // SQLiteから履歴を取得
}

#[tauri::command]
pub async fn search_history(query: String) -> Result<Vec<ClipboardItem>, String> {
    // 全文検索で履歴を検索
}

#[tauri::command]
pub async fn clear_history() -> Result<(), String> {
    // SQLiteデータベースの履歴をクリア
}
```

#### データベースサービス

```rust
pub struct Database {
    connection: Arc<Mutex<Connection>>,
}

impl Database {
    pub async fn save_clipboard_item(&self, item: &ClipboardItem) -> Result<i64, DatabaseError> {
        // SQLiteにクリップボードアイテムを保存
    }
    
    pub async fn get_history(&self, limit: usize, offset: usize) -> Result<Vec<ClipboardItem>, DatabaseError> {
        // ページネーション付きで履歴を取得
    }
    
    pub async fn search_history(&self, query: &str) -> Result<Vec<ClipboardItem>, DatabaseError> {
        // FTSを使用した全文検索
    }
    
    pub async fn toggle_favorite(&self, id: &str) -> Result<(), DatabaseError> {
        // お気に入りステータスを切り替え
    }
    
    pub async fn delete_item(&self, id: &str) -> Result<(), DatabaseError> {
        // 特定のアイテムを削除
    }
}

#[tauri::command]
pub async fn export_history(format: String) -> Result<String, String> {
    // 履歴をJSON/CSV形式でエクスポート
}
```

## 4. データ管理

### 4.1 データ保存方式

クリップボード履歴はSQLiteデータベース、アプリケーション設定はJSONファイルに保存:

```
~/.clipone/
├── clipone.db            # SQLiteデータベース（クリップボード履歴）
├── settings.json         # アプリケーション設定
└── exports/              # エクスポートファイル保存先
    ├── clipboard_export_20250621.csv
    └── clipboard_export_20250621.json
```

### 4.2 データベーススキーマ (SQLite)

#### クリップボード履歴テーブル

```sql
CREATE TABLE clipboard_items (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text/plain',
    timestamp INTEGER NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    source_app TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 全文検索用仮想テーブル
CREATE VIRTUAL TABLE clipboard_search USING fts5(
    content,
    content='clipboard_items',
    content_rowid='rowid'
);

-- インデックス
CREATE INDEX idx_timestamp ON clipboard_items(timestamp DESC);
CREATE INDEX idx_favorite ON clipboard_items(is_favorite, timestamp DESC);
CREATE INDEX idx_content_type ON clipboard_items(content_type);
```

#### 設定データ (settings.json)

```json
{
  "version": "1.0.0",
  "auto_start": true,
  "max_history_items": 1000,
  "hotkeys": {
    "toggle_window": "Ctrl+Shift+V",
    "clear_clipboard": "Ctrl+Shift+C"
  },
  "theme": "dark",
  "window": {
    "width": 800,
    "height": 600,
    "remember_position": true
  },
  "notifications": {
    "enabled": true,
    "show_on_copy": false
  },
  "database": {
    "auto_cleanup": true,
    "cleanup_days": 30
  },
  "export_format": "json"
}
```

### 4.3 データセキュリティとプライバシー

- すべてのデータをローカルに保存（クラウド同期なし）
- 機密データの外部送信なし
- ユーザーによる完全なデータ制御
- 履歴データの手動クリア機能

## 5. システム統合

### 5.1 クリップボード統合パターン

```rust
use clipboard::{ClipboardContext, ClipboardProvider};

pub struct ClipboardManager {
    ctx: ClipboardContext,
    history: Vec<ClipboardItem>,
    is_watching: bool,
}

impl ClipboardManager {
    pub fn new() -> Result<Self, ClipboardError> {
        // 初期化
    }
    
    pub fn get_contents(&mut self) -> Result<String, ClipboardError> {
        // クリップボード内容を取得
    }
    
    pub fn set_contents(&mut self, text: &str) -> Result<(), ClipboardError> {
        // クリップボードに設定
    }
    
    pub fn start_watching(&mut self) -> Result<(), ClipboardError> {
        // 変更監視を開始
    }
}
```

### 5.2 ホットキー統合

```rust
use tauri_plugin_global_shortcut::{Code, Modifiers, ShortcutManager};

#[tauri::command]
pub async fn register_hotkey(
    shortcut: String,
    action: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    // ホットキーを登録
}

#[tauri::command]
pub async fn unregister_hotkey(shortcut: String) -> Result<(), String> {
    // ホットキーの登録を解除
}
```

## 6. パフォーマンス考慮事項

### 6.1 フロントエンド最適化

- 大量の履歴データ用の仮想スクロール
- 高コストコンポーネント用のReact.memo
- デバウンス検索機能
- リアルタイム更新のための効率的な状態管理

### 6.2 バックエンド最適化

- 非同期ファイルI/O操作
- メモリ効率的な履歴管理
- バックグラウンドでの定期的なデータ整理
- 最小限のシステムリソース使用

### 6.3 データベース最適化

```rust
// 履歴サイズ管理
impl Database {
    const MAX_HISTORY_SIZE: usize = 10000;
    const CLEANUP_THRESHOLD: usize = 12000;
    
    pub async fn add_clipboard_item(&self, item: &ClipboardItem) -> Result<(), DatabaseError> {
        // アイテムを挿入
        self.insert_item(item).await?;
        
        // 定期的なクリーンアップ
        let count = self.get_item_count().await?;
        if count > Self::CLEANUP_THRESHOLD {
            self.cleanup_old_items().await?;
        }
        
        Ok(())
    }
    
    async fn cleanup_old_items(&self) -> Result<(), DatabaseError> {
        // 古いアイテムを削除（お気に入り以外）
        sqlx::query!(
            "DELETE FROM clipboard_items 
             WHERE id NOT IN (
                 SELECT id FROM clipboard_items 
                 WHERE is_favorite = TRUE
                 UNION ALL
                 SELECT id FROM clipboard_items 
                 ORDER BY timestamp DESC 
                 LIMIT ?
             )",
            Self::MAX_HISTORY_SIZE
        )
        .execute(&self.connection)
        .await?;
        
        // VACUUMでデータベースサイズを最適化
        sqlx::query!("VACUUM")
            .execute(&self.connection)
            .await?;
            
        Ok(())
    }
}
```

## 7. エラーハンドリング戦略

### 7.1 エラー型

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("クリップボードエラー: {0}")]
    Clipboard(#[from] ClipboardError),
    
    #[error("データベースエラー: {0}")]
    Database(#[from] DatabaseError),
    
    #[error("設定エラー: {0}")]
    Config(#[from] ConfigError),
    
    #[error("シリアライゼーションエラー: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("IOエラー: {0}")]
    Io(#[from] std::io::Error),
}

#[derive(Debug, thiserror::Error)]
pub enum DatabaseError {
    #[error("SQLiteエラー: {0}")]
    Sqlite(#[from] sqlx::Error),
    
    #[error("マイグレーションエラー: {0}")]
    Migration(String),
    
    #[error("アイテムが見つかりません: {0}")]
    NotFound(String),
}
```

### 7.2 エラー回復

- グレースフルな機能劣化
- ユーザーフレンドリーなエラーメッセージ

## 8. テスト戦略

### 8.1 フロントエンドテスト

- **Vitest** - 高速な単体テスト
- **React Testing Library** - コンポーネントテスト
- **@testing-library/user-event** - ユーザーインタラクション テスト
- **MSW (Mock Service Worker)** - APIモック

```typescript
// shadcn/ui コンポーネントのテスト例
import { render, screen } from "@testing-library/react";
import { ClipboardItem } from "@/components/ClipboardItem";

test("renders clipboard item with content", () => {
  const item = {
    id: "1",
    content: "Test content",
    timestamp: Date.now(),
  };

  render(<ClipboardItem item={item} />);
  expect(screen.getByText("Test content")).toBeInTheDocument();
});
```

### 8.2 バックエンドテスト

- Rustの標準テストフレームワーク
- モックを使用したクリップボード操作テスト
- ファイルシステム操作の統合テスト
- エラーハンドリングのテスト

## 9. デプロイメントアーキテクチャ

### 9.1 ビルドプロセス

```bash
# フロントエンドビルド
pnpm build

# 複数プラットフォーム用のTauriビルド
pnpm tauri build -- --target x86_64-pc-windows-msvc
pnpm tauri build -- --target x86_64-apple-darwin
pnpm tauri build -- --target x86_64-unknown-linux-gnu
```

### 9.2 配布

- GitHub Releasesでの自動配布
- プラットフォーム固有のインストーラー
- 自動更新機能の統合（将来実装）

## 10. 開発環境統合

### 10.1 開発環境セットアップ

#### 依存関係インストール

```bash
# フロントエンド依存関係
pnpm add react react-dom react-router-dom
pnpm add -D @types/react @types/react-dom typescript vite

# UI/スタイリング
pnpm add tailwindcss @tailwindcss/typography
pnpm add class-variance-authority clsx tailwind-merge
pnpm add lucide-react @radix-ui/react-*

# Tauri
pnpm add @tauri-apps/api @tauri-apps/plugin-opener
pnpm add tauri-plugin-clipboard-api

# 開発ツール
pnpm add -D @biomejs/biome

# Rust依存関係 (src-tauri/Cargo.toml)
[dependencies]
tauri = { version = "2", features = ["devtools"] }
tauri-plugin-clipboard = "2.1.11"
sqlx = { version = "0.7", features = ["runtime-tokio-rustls", "sqlite"] }
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
```

#### Biome設定

```bash
# Biome初期化
npx biome init

# コード品質チェック
npx biome check .

# 自動修正
npx biome check --write .
```

#### Tailwind CSS設定

```bash
# Tailwind CSS初期化
npx tailwindcss init -p

# shadcn/ui初期化
npx shadcn-ui@latest init

# コンポーネント追加
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add scroll-area
```

### 10.2 開発コマンド

#### フロントエンド開発

```bash
# 開発サーバーを開始（フロントエンドとTauriの両方を実行）
pnpm tauri dev

# フロントエンドのみの開発サーバーを開始
pnpm dev

# アプリケーションをビルド
pnpm build

# 型チェック
pnpm tsc --noEmit

# コード品質チェック
npx biome check .

# 自動修正
npx biome check --write .
```

#### Tauri開発

```bash
# 配布用のTauriアプリケーションをビルド
pnpm tauri build

# Tauri情報を表示
pnpm tauri info
```

#### Rust開発（src-tauriディレクトリから）

```bash
# Rustコードをチェック
cargo check

# Rustテストを実行
cargo test

# Rustコードをフォーマット
cargo fmt
```

## 11. セキュリティ考慮事項

### 11.1 データ保護

- ローカルデータの適切な権限設定
- 機密情報の平文保存回避
- ユーザーデータの完全制御

### 11.2 システムセキュリティ

- 最小権限原則の適用
- セキュアなファイル操作
- クリップボードアクセスの適切な制限
