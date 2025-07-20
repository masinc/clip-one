# 開発ワークフロー

このプロジェクトは厳格なブランチ保護と包括的なIssue追跡を持つ**GitHub Flow**に従います。

## ブランチ保護ルール
- **`main`に直接プッシュ禁止**
- **すべての変更はプルリクエスト経由**
- **`main`からフィーチャーブランチ作成**

## 開発プロセス

### 0. 作業前準備
```bash
git status
git pull origin main  # mainが最新であることを確認
```

### 1. Issue作成
```bash
gh issue create --title "日本語タイトル" --body "説明" --label "priority: medium,enhancement,ui"
```

### 2. TODOリスト作成
TodoWriteツールを使ってIssueを実行可能なタスクに分解：
- 開発ワークフローステップ
- 機能実装タスク
- ドキュメント更新
- テストタスク

### 3. ブランチ作成
```bash
gh issue develop <issue-number> --checkout
```

### 4. 開発作業
- TODOステータス更新（pending → in_progress → completed）
- コミットメッセージ形式に従う：
```
type(scope): 日本語での説明

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 5. プルリクエスト作成
```bash
gh pr create --title "日本語タイトル" --body "PR説明" --label "priority: medium,enhancement"
```

**PRテンプレート:**
```markdown
## 概要
日本語での簡潔な説明

## 関連 Issue
Closes #[issue番号]

## 変更内容
- 変更点1
- 変更点2

## テスト
- [ ] コード品質チェック
- [ ] 型チェック通過
- [ ] ビルド成功

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 6. マージ前要件
**レビュー承認後、マージ前:**
- CHANGELOG.md更新
- package.jsonとCargo.tomlの両方でバージョン更新
- すべてのテストが通過することを確認

### 7. マージ
```bash
gh pr merge <pr-number> --squash --delete-branch
```

### 8. マージ後整理
```bash
git checkout main
git fetch origin
git reset --hard origin/main
```

## 必須ラベル
- **優先度**: high/medium/low（必須）
- **エリア**: clipboard/ui/core
- **タイプ**: bug/enhancement/documentation

## 言語要件
- **すべてのIssue、PR、コミットメッセージは日本語**
- **常にTODOタスクを作成・更新**

## 品質チェックリスト
**PR作成前:**
- [ ] `npx biome check .`（エラー0個）
- [ ] `pnpm tsc --noEmit`
- [ ] `cargo test`（src-tauriから）
- [ ] `pnpm build`
- [ ] 手動テスト

## バージョン管理
- **PATCH (0.0.x)**: バグ修正、ドキュメント
- **MINOR (0.x.0)**: 新機能、改善
- **MAJOR (x.0.0)**: 破壊的変更（開発中は避ける）

## エリアラベル使い分け
- **clipboard**: クリップボード機能、履歴、監視
- **ui**: ユーザーインターフェース、画面、操作性
- **core**: アプリ設定、ファイル処理、システム統合

## 緊急時手順

### ホットフィックスプロセス
1. `priority: high` Issue作成
2. `main`からホットフィックスブランチ作成
3. 最小限の修正実装
4. PR高速レビュー
5. 即座にマージ・デプロイ

### ロールバックプロセス
1. ロールバックIssue作成
2. `git revert <commit-hash>`
3. 高速レビュー
4. 即座にロールバック・デプロイ