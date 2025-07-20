# ClipOne - アプリケーション仕様書

## 概要
ClipOneは、Tauri + React + TypeScript + Rustで構築されたデスクトップクリップボード履歴管理アプリケーションです。

**対象ユーザー**: 頻繁にコピー&ペーストを行う開発者、ライター、事務職

## コア機能

### クリップボード監視と履歴
- 自動クリップボード変更検出
- 履歴保存と表示
- リアルタイム同期

### 履歴管理
- 時系列ベースの履歴ビュー
- 検索機能（部分文字列マッチ）
- 個別削除または全削除
- お気に入り機能

### データ操作
- ローカルSQLiteストレージ
- エクスポート/インポート（JSON、CSV）
- 設定の永続化

## 技術アーキテクチャ

### データ保存場所
```
~/.clipone/
├── clipone.db       # SQLite（クリップボード履歴）
└── settings.json    # アプリ設定
```

### データベーススキーマ
```sql
CREATE TABLE clipboard_items (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text/plain',
    timestamp INTEGER NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    source_app TEXT
);
```

### コアデータ型
```typescript
interface ClipboardItem {
  id: string;
  content: string;
  timestamp: number;
  is_favorite: boolean;
  source_app?: string;
}

interface AppSettings {
  max_history_items: number;
  auto_start: boolean;
  theme: 'light' | 'dark';
  hotkeys: Record<string, string>;
}
```

