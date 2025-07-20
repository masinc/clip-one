-- 003_multiple_formats.sql
-- 複数形式コンテンツ保存のためのテーブル拡張

-- 複数形式のコンテンツを保存するJSONカラムを追加
ALTER TABLE clipboard_items ADD COLUMN format_contents TEXT;

-- 既存データに対してデフォルト値を設定
UPDATE clipboard_items 
SET format_contents = json_object(
    COALESCE(primary_format, content_type, 'text/plain'), 
    content
)
WHERE format_contents IS NULL;

-- インデックスを追加（JSON検索の高速化）
CREATE INDEX IF NOT EXISTS idx_clipboard_items_format_contents ON clipboard_items(format_contents);

-- 形式別データサイズ統計用のビューを作成
CREATE VIEW IF NOT EXISTS format_content_statistics AS
SELECT 
    id,
    primary_format,
    json_extract(available_formats, '$') as formats,
    json_extract(format_contents, '$') as contents,
    LENGTH(format_contents) as total_size,
    timestamp
FROM clipboard_items 
WHERE format_contents IS NOT NULL
ORDER BY timestamp DESC;