-- 正規化されたクリップボード管理システムの統合スキーマ

-- 外部キー制約を有効化
PRAGMA foreign_keys = ON;

-- メインのクリップボードアイテムテーブル（正規化済み）
CREATE TABLE clipboard_items (
    id TEXT PRIMARY KEY,
    primary_format TEXT NOT NULL DEFAULT 'text/plain',
    timestamp INTEGER NOT NULL,
    is_favorite BOOLEAN DEFAULT FALSE,
    source_app TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 正規化されたコンテンツテーブル
CREATE TABLE clipboard_contents (
    item_id TEXT NOT NULL,
    format TEXT NOT NULL,
    content TEXT NOT NULL,
    data_size INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, format),
    FOREIGN KEY (item_id) REFERENCES clipboard_items(id) ON DELETE CASCADE
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX idx_clipboard_items_timestamp ON clipboard_items(timestamp);
CREATE INDEX idx_clipboard_items_primary_format ON clipboard_items(primary_format);
CREATE INDEX idx_clipboard_items_favorite ON clipboard_items(is_favorite);
CREATE INDEX idx_clipboard_contents_format ON clipboard_contents(format);
CREATE INDEX idx_clipboard_contents_item_id ON clipboard_contents(item_id);
CREATE INDEX idx_clipboard_contents_data_size ON clipboard_contents(data_size);

-- 全文検索テーブル（FTS5）
CREATE VIRTUAL TABLE clipboard_search USING fts5(
    item_id UNINDEXED,
    format UNINDEXED,
    content,
    content='clipboard_contents',
    content_rowid='rowid'
);

-- 全文検索の自動更新トリガー
CREATE TRIGGER clipboard_contents_ai AFTER INSERT ON clipboard_contents BEGIN
    INSERT INTO clipboard_search(item_id, format, content) VALUES (new.item_id, new.format, new.content);
END;

CREATE TRIGGER clipboard_contents_ad AFTER DELETE ON clipboard_contents BEGIN
    DELETE FROM clipboard_search WHERE item_id = old.item_id AND format = old.format;
END;

CREATE TRIGGER clipboard_contents_au AFTER UPDATE ON clipboard_contents BEGIN
    DELETE FROM clipboard_search WHERE item_id = old.item_id AND format = old.format;
    INSERT INTO clipboard_search(item_id, format, content) VALUES (new.item_id, new.format, new.content);
END;

-- 統計ビュー（形式別データ分析用）
CREATE VIEW format_statistics AS
SELECT 
    cc.format,
    COUNT(*) as count,
    AVG(cc.data_size) as avg_size,
    SUM(cc.data_size) as total_size,
    MAX(ci.timestamp) as last_used,
    COUNT(CASE WHEN ci.is_favorite THEN 1 END) as favorite_count
FROM clipboard_contents cc
JOIN clipboard_items ci ON cc.item_id = ci.id
GROUP BY cc.format
ORDER BY count DESC;

-- アイテム詳細ビュー（JOIN結果のキャッシュ用）
CREATE VIEW item_details AS
SELECT 
    ci.id,
    ci.primary_format,
    ci.timestamp,
    ci.is_favorite,
    ci.source_app,
    ci.created_at,
    COUNT(cc.format) as format_count,
    SUM(cc.data_size) as total_content_size
FROM clipboard_items ci
LEFT JOIN clipboard_contents cc ON ci.id = cc.item_id
GROUP BY ci.id, ci.primary_format, ci.timestamp, ci.is_favorite, ci.source_app, ci.created_at
ORDER BY ci.timestamp DESC;