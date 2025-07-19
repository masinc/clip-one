-- ClipOne データベース初期スキーマ
-- クリップボード履歴テーブル
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

-- 全文検索トリガー
CREATE TRIGGER clipboard_search_insert AFTER INSERT ON clipboard_items BEGIN
    INSERT INTO clipboard_search(rowid, content) VALUES (new.rowid, new.content);
END;

CREATE TRIGGER clipboard_search_delete AFTER DELETE ON clipboard_items BEGIN
    INSERT INTO clipboard_search(clipboard_search, rowid, content) VALUES('delete', old.rowid, old.content);
END;

CREATE TRIGGER clipboard_search_update AFTER UPDATE ON clipboard_items BEGIN
    INSERT INTO clipboard_search(clipboard_search, rowid, content) VALUES('delete', old.rowid, old.content);
    INSERT INTO clipboard_search(rowid, content) VALUES (new.rowid, new.content);
END;