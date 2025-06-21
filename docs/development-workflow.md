# 開発ワークフロー

このドキュメントは、ClipOneプロジェクトの完全な開発ワークフローを説明します。詳細なプロセス、ベストプラクティス、コマンドリファレンスを含みます。

## 概要

このプロジェクトは厳格なブランチ保護ルールと包括的なIssue追跡を持つ**GitHub Flow**に従います。

### ブランチ保護ルール
- **`main`ブランチに直接プッシュ禁止**
- **すべての変更はプルリクエスト経由必須**
- **フィーチャーブランチは`main`から作成**

## 完全な開発プロセス

### 0. 作業開始前の準備
開発を開始する前に必ず以下を確認：

```bash
# 現在のブランチ状況を確認
git status

# mainブランチが最新か確認（進んでいる場合は先にPR作成が必要）
git fetch origin
git log main..origin/main --oneline  # 空であればOK

# mainブランチに切り替え
git checkout main

# ローカルmainを最新に更新
git pull origin main
```

⚠️ **重要**: mainブランチがorigin/mainより進んでいる場合は、直接プッシュ禁止ルールに従い、先にPRを作成してマージしてください。

### 1. Issue作成
常にGitHub Issueの作成から開始：

```bash
# ラベル付きで新しいIssueを作成 (優先度必須)
gh issue create --title "日本語でのIssueタイトル" --body "Issue説明" --label "priority: high,bug,ui"

# 既存のIssueをリスト表示
gh issue list

# Issue詳細を表示
gh issue view <issue-number>
```

### 2. TODOリスト作成
TodoWriteツールを使ってIssueを実行可能なタスクに分解：

#### TODOタスクとして追加すべき内容
- **開発ワークフロー**: 作業前準備、Issue作成、ブランチ作成、コミット、PR作成、CHANGELOG+バージョン更新（レビュー承認後）、マージ後整理
- **機能実装**: 機能を具体的なコーディングタスクに分解
- **ドキュメント更新**: コード変更に伴うドキュメント更新が必要な場合
- **テストタスク**: 単体テスト、統合テスト、手動テスト
- **コードレビュー項目**: レビューフィードバックを体系的に対応
- **リファクタリング手順**: コード構造改善時
- **バグ調査**: 再現手順と修正のステップ

#### TODOベストプラクティス
- **TodoWriteから開始**: 最初に包括的なタスクリストを作成
- **ステータスを頻繁に更新**: 開始時にin_progress、完了時にcompletedにマーク
- **一度に一つのタスクをin_progress**: 単一タスクに集中
- **TodoReadを定期的に使用**: 進捗と次のステップを確認
- **タスクを即座に完了**: 完了をバッチ処理せず、終了時にすぐマーク

#### TODOタスク例
**開発ワークフロータスク:**
```
1. 作業前準備 (pending)
2. Issue作成 (pending)
3. ブランチ作成 (pending)
4. 機能実装 (pending)
5. PR作成 (pending)
6. CHANGELOG+バージョン更新 (pending)
7. マージ後整理 (pending)
```

**機能実装タスク例:**
```
1. クリップボード監視機能の設計 (pending)
2. Rustバックエンドコマンド実装 (pending)
3. Reactフロントエンドコンポーネント作成 (pending)
4. 単体テスト作成 (pending)
5. 統合テスト実行 (pending)
```

### 3. ブランチ作成と開発
Issueから直接フィーチャーブランチを作成：

```bash
# Issueからブランチを作成して開発開始（自動チェックアウト）
gh issue develop <issue-number> --checkout

# または最新のmainから明示的にブランチ作成
gh issue develop <issue-number> --checkout --base main

# これによりIssueにちなんだ名前のブランチが自動作成され、そのブランチに切り替わる
```

### 4. 開発作業
- 進捗に応じてTODOタスクステータスを更新 (pending → in_progress → completed)
- 日本語で説明的なメッセージで定期的にコミット
- conventional commitsフォーマットに従う：
  ```
  type(scope): 日本語での説明
  
  🤖 Generated with [Claude Code](https://claude.ai/code)
  
  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### 5. 変更をプッシュ
```bash
# オリジンにプッシュ
git push origin <branch-name>
```

### 6. プルリクエスト作成
適切なラベルとIssue自動クローズテンプレートでPRを作成：

```bash
# ラベル付きでプルリクエストを作成 (優先度必須)
gh pr create --title "日本語でのPRタイトル" --body "PR説明" --label "priority: medium,enhancement,clipboard"
```

#### プルリクエストテンプレート
適切なラベル付きIssue自動クローズテンプレートを常に使用：
```markdown
## 概要
この PR の変更内容を日本語で説明

## 関連 Issue
Closes #[Issue番号]

## 変更内容
- 変更点1
- 変更点2

## テスト
- [ ] 動作確認済み
- [ ] 型チェック通過
- [ ] ビルド成功

## ラベル
- 適切なタイプラベル (bug/enhancement/documentation)
- 必要に応じて管理ラベル追加

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### 7. コードレビュープロセス
- チームが実装をレビュー
- TODOタスクを使ってフィードバックに体系的に対応
- 必要に応じてラベルを更新（`needs-review`、`needs-testing`等を追加）

### 8. CHANGELOGとバージョン管理
⚠️ **タイミング重要**: レビュー承認後、マージ前に実行

#### バージョン更新チェックリスト
必ず以下の**すべて**のファイルでバージョンを同期：
- [ ] `package.json` のversion
- [ ] `src-tauri/Cargo.toml` のversion
- [ ] `src-tauri/Cargo.lock` のversion（cargo checkで自動更新）

#### バージョン増分ルール
- **PATCH (0.0.x)**: バグ修正、ドキュメント更新、リファクタリング
- **MINOR (0.x.0)**: 新機能追加、機能改善
- **MAJOR (x.0.0)**: 破壊的変更（開発中は避ける）

#### 実行手順
```bash
# 1. バージョン更新（例：0.1.0 → 0.1.1）
# package.json
sed -i 's/"version": "0.1.0"/"version": "0.1.1"/' package.json

# src-tauri/Cargo.toml  
sed -i 's/version = "0.1.0"/version = "0.1.1"/' src-tauri/Cargo.toml

# 2. CHANGELOG更新
# [Unreleased] → [0.1.1] - 2025-XX-XX に変更
# Issue/PR参照を追加

# 3. Cargo.lockを更新
cd src-tauri
cargo check  # Cargo.lockを自動更新
cd ..

# 4. 変更をコミット
git add package.json src-tauri/Cargo.toml src-tauri/Cargo.lock CHANGELOG.md
git commit -m "docs: CHANGELOGとバージョン更新

- package.json: 0.1.0 → 0.1.1
- src-tauri/Cargo.toml: 0.1.0 → 0.1.1
- src-tauri/Cargo.lock: 0.1.0 → 0.1.1
- CHANGELOG.md: v0.1.1エントリ追加"
```

#### CHANGELOGを更新するタイミング
- **レビュー承認後**: コードレビュー完了後にCHANGELOG.mdとバージョンを更新
- **マージ前**: PRマージ前の最終ステップ
- **重要な変更毎**: 新機能、バグ修正、破壊的変更、非推奨化
- **両方の参照を含める**: 常にIssueとPR番号の完全URLを含める
- **バージョン連携**: package.jsonバージョンとCHANGELOGを同時に更新
- **バージョン戦略**: 修正はPATCH、機能追加はMINOR、開発中はMAJOR避ける

#### CHANGELOGフォーマット
```markdown
# Changelog

## [Unreleased]
### Added
- 新機能の説明を日本語で ([#123](https://github.com/masinc/clip-one/issues/123), [PR#124](https://github.com/masinc/clip-one/pull/124))

### Changed
- 変更された機能の説明を日本語で ([#125](https://github.com/masinc/clip-one/issues/125), [PR#126](https://github.com/masinc/clip-one/pull/126))

### Fixed
- バグ修正の説明を日本語で ([#131](https://github.com/masinc/clip-one/issues/131), [PR#132](https://github.com/masinc/clip-one/pull/132))
```

#### CHANGELOGベストプラクティス
- **日本語で記述**: 一貫性のためすべてのエントリは日本語
- **ユーザー視点の説明**: 技術的詳細ではなく、ユーザーへの影響を説明
- **参照を必ず含める**: すべてのエントリにIssueとPRの完全URLリンクを含める
- **参照フォーマット**: `([#Issue番号](URL), [PR#PR番号](URL))` 形式を使用
- **時系列順**: 最新の変更を上部に配置
- **Unreleased セクション**: 今後の変更用に常に[Unreleased]セクションを維持
- **完全なトレーサビリティ**: すべての変更がIssueとPRまで遡れることを保証
- **レビュー後更新**: レビュー承認後、マージ前にCHANGELOGとバージョンを更新
- **セマンティックバージョニング**: package.jsonバージョン更新時はsemverに従う
- **バージョン増分**: バグ修正はPATCH (0.0.x)、新機能はMINOR (0.x.0) を使用
- **メジャーバージョン制限**: 開発フェーズ中はMAJORバージョン (x.0.0) を増分しない

### 9. 最終コミットとプッシュ
```bash
# CHANGELOGとバージョン更新をコミット
git add CHANGELOG.md package.json src-tauri/Cargo.toml src-tauri/Cargo.lock
git commit -m "docs: CHANGELOGとバージョン更新

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# 最終変更をプッシュ
git push origin <branch-name>
```

### 10. マージ
```bash
# プルリクエストをマージ（推奨：スカッシュマージ）
gh pr merge <pr-number> --squash --delete-branch

# またはマージせずにクローズ（ブランチは自動削除）
gh pr close <pr-number> --delete-branch
```

### 11. マージ後の作業
マージ完了後、ローカル環境を整理：

```bash
# mainブランチに切り替え
git checkout main

# リモートの最新状態を取得
git fetch origin

# ローカルmainをリモートmainに同期
git reset --hard origin/main

# 不要なローカルブランチを削除
git branch -d <feature-branch-name>

# 現在の状況確認
git status
git log --oneline -5
```

⚠️ **重要**: マージ後は必ずローカルmainを最新状態に同期してから次の作業を開始してください。

## ブランチ命名規則
- **機能**: `feature/description` (例: `feature/clipboard-history`)
- **バグ修正**: `fix/description` (例: `fix/memory-leak`)
- **ドキュメント**: `docs/description` (例: `docs/api-specification`)
- **リファクタリング**: `refactor/description` (例: `refactor/rust-backend`)

## 言語要件
- **すべてのIssue、PR、コミットメッセージは日本語で記述**

## コミットメッセージ形式
conventional commitsフォーマットを**日本語**で:
```
type(scope): 日本語での説明

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## プルリクエストテンプレート
適切なラベル付きIssue自動クローズテンプレートを使用:
```markdown
## 概要
この PR の変更内容を日本語で説明

## 関連 Issue
Closes #[Issue番号]

## 変更内容
- 変更点1
- 変更点2

## テスト
- [ ] 動作確認済み
- [ ] 型チェック通過
- [ ] ビルド成功

## ラベル
- 適切なタイプラベル (bug/enhancement/documentation)
- 必要に応じて管理ラベル追加

🤖 Generated with [Claude Code](https://claude.ai/code)
```
- **コードコメントとドキュメントはファイルの言語に従う**（英語ドキュメントは英語、日本語ドキュメントは日本語）

## GitHub CLIコマンドリファレンス

### Issue管理
```bash
# 新しいIssueを作成
gh issue create --title "日本語でのIssueタイトル" --body "Issue説明"

# ラベル付きでIssueを作成 (優先度必須)
gh issue create --title "タイトル" --body "説明" --label "priority: high,bug,clipboard"

# Issueリストを表示
gh issue list

# Issue詳細を表示
gh issue view <issue-number>

# Issueからブランチを作成して開発開始
gh issue develop <issue-number> --checkout
```

### プルリクエスト管理
```bash
# プルリクエストを作成
gh pr create --title "日本語でのPRタイトル" --body "PR説明"

# ラベル付きでPRを作成 (優先度必須)
gh pr create --title "タイトル" --body "説明" --label "priority: medium,enhancement,clipboard"

# プルリクエストリストを表示
gh pr list

# プルリクエスト詳細を表示
gh pr view <pr-number>

# プルリクエストをマージ
gh pr merge <pr-number>

# プルリクエストをクローズしてブランチも削除
gh pr close <pr-number> --delete-branch
```

### ラベル管理
```bash
# 全ラベルを一覧表示
gh label list

# Issueにラベルを追加
gh issue edit <issue-number> --add-label "ラベル名"

# プルリクエストにラベルを追加
gh pr edit <pr-number> --add-label "ラベル名"

# Issueからラベルを削除
gh issue edit <issue-number> --remove-label "ラベル名"
```

### リポジトリ操作
```bash
# リポジトリ情報を表示
gh repo view
```

## GitHubラベルシステム

### ラベル必須ルール
- **優先度**: priority: high/medium/low (**必須**)
- **エリア**: clipboard/ui/core (該当する場合)
- **タイプ**: bug/enhancement/documentation (該当する場合)
- **ワークフロー**: needs-review/needs-testing/blocked (該当する場合)

### エリアラベルの使い分け
- **clipboard**: クリップボード機能、履歴管理、監視機能
- **ui**: ユーザーインターフェース、画面、操作性
- **core**: アプリ設定、ファイル処理、システム統合

### ワークフローラベル
- **needs-review**: コードレビューが必要
- **needs-testing**: テストが必要
- **blocked**: 他の作業により進行がブロックされている

## テストと品質保証

### PR作成前
- [ ] 型チェック実行: `pnpm tsc --noEmit`
- [ ] テスト実行: `cargo test` (src-tauriディレクトリから)
- [ ] Rustコードチェック: `cargo check`
- [ ] Rustコードフォーマット: `cargo fmt`
- [ ] アプリケーションビルド: `pnpm build`
- [ ] 変更の手動テスト

### レビュー中
- [ ] すべてのレビューフィードバックに対応
- [ ] レビュー項目のTODOタスクを更新
- [ ] 新機能のテストを追加
- [ ] 必要に応じてドキュメントを更新

### マージ前
- [ ] すべてのテストが通過
- [ ] CHANGELOG更新済み
- [ ] バージョン増分済み
- [ ] 最終手動テスト完了

## 緊急時手順

### ホットフィックスプロセス
本番環境の重要なバグに対して：

1. `priority: high`ラベル付きでホットフィックスIssueを作成
2. `main`からホットフィックスブランチ作成: `git checkout -b hotfix/critical-bug-name`
3. 最小限の変更でIssueを修正
4. 通常のPRプロセスに従うがレビューを迅速化
5. マージ後即座にデプロイ

### ロールバックプロセス
マージ後に問題が発見された場合：

1. ロールバックIssueを作成
2. リバートPRを作成: `git revert <commit-hash>`
3. 迅速レビュープロセスに従う
4. ロールバックを即座にデプロイ

## 自動化とツール

### GitHub Actions
- PR作成時の自動ラベル適用
- プッシュ時の自動テスト
- CHANGELOG検証
- バージョン一貫性チェック

### VS Code統合
- Issue/PR管理用のGitHub CLI拡張機能を使用
- 共通コマンド用タスクランナーを設定
- Tauri開発用デバッグを設定

## トラブルシューティング

### よくある問題
- **ブランチ保護**: 直接プッシュではなくPRを使用していることを確認
- **ラベル不足**: Issue/PRに必要なタイプラベルを追加
- **CHANGELOGフォーマット**: 完全URLでの正確なフォーマットに従う
- **バージョン競合**: セマンティックバージョニングルールに従っていることを確認

### ヘルプの取得
- 明確化が必要な場合は`question`ラベルを使用
- 複雑な技術的問題には`help wanted`ラベルを使用
- 技術的ガイダンスは[@docs/architecture.md](/docs/architecture.md)を参照
- 機能要件は[@docs/specification.md](/docs/specification.md)を確認