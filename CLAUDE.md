# CLAUDE.md

このファイルは、このリポジトリでコードを扱う際にClaude Code (claude.ai/code) にガイダンスを提供します。

## 🚨 絶対に忘れてはならない重要ルール

### mainブランチ保護
- **`main`ブランチに直接プッシュ禁止**
- **すべての変更はプルリクエスト経由必須**
- **必ずGitHub Issue作成から開始**

### 開発ワークフロー（8ステップ）
0. **作業前準備**: `git status` → `git pull origin main`
1. **Issue作成**: `gh issue create --title "日本語タイトル" --label "priority: medium"`
2. **TODOリスト作成**: TodoWriteツールでタスク分解
3. **ブランチ作成**: `gh issue develop <issue-number> --checkout`
4. **作業**: TODOステータス更新 (pending → in_progress → completed)
5. **PR作成**: `gh pr create --label "priority: medium"`
6. **CHANGELOG+バージョン更新**: レビュー承認後、マージ前（**package.json + Cargo.toml両方必須**）
7. **マージ**: `gh pr merge <pr-number> --squash --delete-branch`
8. **マージ後整理**: `git reset --hard origin/main`

### ラベル必須ルール
- **優先度**: priority: high/medium/low (**必須**)
- **エリア**: clipboard/ui/core (該当する場合)
- **タイプ**: bug/enhancement/documentation (該当する場合)

### 言語要件
- **すべてのIssue、PR、コミットメッセージは日本語**
- **TODOタスクは常に作成・更新**

## 📋 参照ドキュメント

> **重要**: 詳細な手順やルールは以下のドキュメントを参照すること

- **プロジェクト概要**: [@README.md](/README.md)
- **アプリケーション仕様**: [@docs/specification.md](/docs/specification.md)
- **技術アーキテクチャ**: [@docs/architecture.md](/docs/architecture.md)
- **開発ワークフロー詳細**: [@docs/development-workflow.md](/docs/development-workflow.md)

### ドキュメント使用ルール
1. **作業前**: 関連ドキュメントを必ず読む
2. **参照時**: `[@filename](/path)` 形式で言及
3. **更新後**: 関連ドキュメントも即座に更新

## 🛠️ プロジェクト概要

**ClipOne** - クリップボード履歴管理デスクトップアプリケーション  
**技術**: Tauri + React + TypeScript + Rust

### 主要機能
- クリップボード変更の自動監視
- 履歴の保存と管理
- 検索機能
- エクスポート/インポート機能

## ⚡ クイックコマンド

```bash
# 開発開始
pnpm tauri dev

# 型チェック
pnpm tsc --noEmit

# ビルド
pnpm build

# Rust確認
cargo check  # src-tauriから
```

## 🏗️ アーキテクチャ概要

### フロントエンド (React + TypeScript)
```
src/
├── components/       # UIコンポーネント
├── hooks/           # カスタムフック
├── types/           # TypeScript型定義
├── utils/           # ユーティリティ
└── stores/          # 状態管理
```

### バックエンド (Rust + Tauri)
```
src-tauri/src/
├── commands/        # Tauriコマンド
│   ├── clipboard.rs # クリップボード操作
│   ├── history.rs   # 履歴管理
│   └── settings.rs  # 設定管理
├── lib.rs
└── main.rs
```

## 📊 データ構造

### 履歴アイテム
```typescript
interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  is_favorite: boolean;
  source_app?: string;
}
```

### アプリ設定
```typescript
interface AppSettings {
  max_history_items: number;
  auto_start: boolean;
  theme: 'light' | 'dark';
  hotkeys: Record<string, string>;
}
```

## 🔧 開発ガイドライン

### エリアラベル使い分け
- **clipboard**: クリップボード機能、履歴管理、監視機能
- **ui**: ユーザーインターフェース、画面、操作性
- **core**: アプリ設定、ファイル処理、システム統合

### コミットメッセージ形式
```
type(scope): 日本語での説明

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### バージョン管理
- **PATCH (0.0.x)**: バグ修正、ドキュメント更新
- **MINOR (0.x.0)**: 新機能追加、機能改善
- **MAJOR (x.0.0)**: 破壊的変更（開発中は避ける）

## 🗂️ ファイル構成

### 設定ファイル
- `package.json` - Node.js依存関係とスクリプト
- `src-tauri/Cargo.toml` - Rust依存関係
- `tsconfig.json` - TypeScript設定
- `vite.config.ts` - Vite設定

### データ保存場所
```
~/.clipone/
├── clipone.db       # SQLiteデータベース（クリップボード履歴）
└── settings.json    # アプリケーション設定
```

## 🧪 テスト要件

### PR作成前チェックリスト
- [ ] 型チェック: `pnpm tsc --noEmit`
- [ ] Rustテスト: `cargo test` (src-tauriから)
- [ ] ビルド確認: `pnpm build`
- [ ] 手動テスト実行

## 🚀 デプロイ

### ビルドターゲット
- Windows (x86_64-pc-windows-msvc)
- macOS (x86_64-apple-darwin)
- Linux (x86_64-unknown-linux-gnu)

### リリースプロセス
1. バージョン更新 (package.json + Cargo.toml)
2. CHANGELOG更新
3. GitHub Releaseでの配布

## 🔍 よくある作業パターン

### 新機能追加
1. Issue作成 (`gh issue create`)
2. 仕様確認 (`@docs/specification.md`)
3. アーキテクチャ参照 (`@docs/architecture.md`)
4. 実装開始

### バグ修正
1. Issue作成 (`priority: high`)
2. 再現手順確認
3. 修正実装
4. テスト実行

### UI改善
1. ラベル: `ui, enhancement`
2. React コンポーネント更新
3. スタイリング調整
4. レスポンシブ確認

### Rust機能追加
1. `src-tauri/src/commands/` に新コマンド追加
2. Tauriコマンドとしてエクスポート
3. フロントエンドから呼び出し実装
4. 型定義更新