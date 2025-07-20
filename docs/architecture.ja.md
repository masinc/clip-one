# ClipOne - 技術アーキテクチャ

## システム概要
ClipOneは、最適なパフォーマンスとネイティブOS統合のためにReactフロントエンドとRustバックエンドを組み合わせたTauriフレームワーク上に構築されています。

```
フロントエンド (React + TypeScript) ↔ Tauri Core ↔ バックエンド (Rust)
                                           ↕
                                   ローカルストレージ (SQLite)
```

## フロントエンドスタック
- **React 18** + **TypeScript** - 型安全なUIフレームワーク
- **React Router v7** - データローダー付きルーティング
- **Tailwind CSS** + **shadcn/ui** - スタイリングとコンポーネント
- **Vite** - ビルドツール
- **Biome** - リンティングとフォーマット

## コンポーネント構造
```
src/
├── components/
│   ├── home/           # ホームページコンポーネント
│   ├── actions/        # アクション設定コンポーネント
│   └── ui/             # shadcn/uiコンポーネント
├── pages/              # ルートコンポーネント
├── hooks/              # カスタムReactフック
├── types/              # TypeScript定義
├── utils/              # ユーティリティ関数
└── contexts/           # Reactコンテキスト
```

## バックエンドスタック
- **Tauri v2** - デスクトップアプリフレームワーク
- **Rust** - システムプログラミング言語
- **SQLx** - 非同期SQLiteドライバー
- **Serde** - シリアライゼーション
- **Tokio** - 非同期ランタイム

## Rustコマンド構造
```
src-tauri/src/
├── commands/
│   ├── clipboard.rs    # クリップボード操作
│   ├── history.rs      # 履歴管理
│   └── settings.rs     # 設定管理
├── lib.rs
└── main.rs
```

## 主要Tauriコマンド
```rust
// クリップボード操作
get_clipboard_text() -> String
set_clipboard_text(text: String)
start_clipboard_monitoring()
stop_clipboard_monitoring()

// 履歴管理
get_clipboard_history(limit: Option<usize>) -> Vec<ClipboardItem>
save_clipboard_item(item: ClipboardItem)
search_history(query: String) -> Vec<ClipboardItem>
clear_clipboard_history()

// 設定
get_app_settings() -> AppSettings
save_app_settings(settings: AppSettings)
```

## データフロー
```
クリップボード変更 → Rust監視 → SQLite → イベント → React更新
ユーザーアクション → React → Tauriコマンド → Rust → SQLite
```

## パフォーマンス最適化
### フロントエンド
- 高コストコンポーネント用React.memo
- イベントハンドラー用useCallback
- 大きなリスト用仮想スクロール
- デバウンス検索

### バックエンド
- 非同期ファイルI/O
- コネクションプーリング
- バックグラウンドクリーンアップ
- 最小メモリ使用

## ビルドターゲット
- Windows (x86_64-pc-windows-msvc)
- macOS (x86_64-apple-darwin) 
- Linux (x86_64-unknown-linux-gnu)