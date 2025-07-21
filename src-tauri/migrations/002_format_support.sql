-- 002_format_support.sql
-- クリップボード形式多様化対応のためのデータベース拡張

-- 利用可能な形式を保存するカラムを追加（JSON配列）
ALTER TABLE clipboard_items ADD COLUMN available_formats TEXT;

-- プライマリ形式を保存するカラムを追加
ALTER TABLE clipboard_items ADD COLUMN primary_format TEXT;

-- データサイズを保存するカラムを追加
ALTER TABLE clipboard_items ADD COLUMN data_size INTEGER;

-- 既存データに対してデフォルト値を設定
UPDATE clipboard_items 
SET available_formats = '["text/plain"]',
    primary_format = COALESCE(content_type, 'text/plain'),
    data_size = LENGTH(content)
WHERE available_formats IS NULL;

-- インデックスを追加（形式別検索の高速化）
CREATE INDEX IF NOT EXISTS idx_clipboard_items_primary_format ON clipboard_items(primary_format);
CREATE INDEX IF NOT EXISTS idx_clipboard_items_data_size ON clipboard_items(data_size);

-- 形式統計用のビューを作成
CREATE VIEW IF NOT EXISTS format_statistics AS
SELECT 
    primary_format,
    COUNT(*) as count,
    AVG(data_size) as avg_size,
    MAX(timestamp) as last_used
FROM clipboard_items 
GROUP BY primary_format
ORDER BY count DESC;