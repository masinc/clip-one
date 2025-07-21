use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{migrate::Migrator, sqlite::SqlitePool, Row};
use std::path::PathBuf;
use uuid::Uuid;

// SQLx標準マイグレーション
static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

/// 正規化されたクリップボードアイテムの構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardItem {
    pub id: String,
    pub primary_format: String,
    pub timestamp: i64,
    pub is_favorite: bool,
    pub source_app: Option<String>,
    pub created_at: DateTime<Utc>,
    pub contents: Vec<ClipboardContent>,
}

/// クリップボードコンテンツの構造体（正規化されたテーブル用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardContent {
    pub item_id: String,
    pub format: String,
    pub content: String,
    pub data_size: i64,
    pub created_at: DateTime<Utc>,
}

/// 旧形式との互換性のためのDisplayClipboardItem（フロントエンド用）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayClipboardItem {
    pub id: String,
    pub content: String,
    pub content_type: String,
    pub timestamp: i64,
    pub is_favorite: bool,
    pub source_app: Option<String>,
    pub created_at: DateTime<Utc>,
    pub available_formats: Option<Vec<String>>,
    pub format_contents: Option<std::collections::HashMap<String, String>>,
}

/// データベース接続とマイグレーション管理
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    /// データベース接続を初期化
    pub async fn new() -> Result<Self> {
        let db_path = Self::get_database_path().await?;

        println!("データベースパス: {}", db_path.display());

        // データベースディレクトリを作成
        if let Some(parent) = db_path.parent() {
            println!("ディレクトリ作成: {}", parent.display());
            tokio::fs::create_dir_all(parent).await?;

            // ディレクトリが実際に作成されたか確認
            if parent.exists() {
                println!("ディレクトリ作成成功: {}", parent.display());
            } else {
                println!("ディレクトリ作成失敗: {}", parent.display());
            }
        }

        // WindowsでSQLiteの絶対パスを使用する場合は sqlite:/// が必要
        let database_url = if cfg!(windows) {
            format!(
                "sqlite:///{}",
                db_path.display().to_string().replace('\\', "/")
            )
        } else {
            format!("sqlite://{}", db_path.display())
        };
        println!("データベースURL: {}", database_url);

        // 空のファイルを事前作成してみる
        if !db_path.exists() {
            println!("データベースファイル事前作成: {}", db_path.display());
            if let Err(e) = tokio::fs::File::create(&db_path).await {
                println!("ファイル作成エラー: {}", e);
                return Err(anyhow::anyhow!("ファイル作成エラー: {}", e));
            }
        }

        let pool = match SqlitePool::connect(&database_url).await {
            Ok(pool) => {
                println!("データベース接続成功");
                pool
            }
            Err(e) => {
                println!("データベース接続エラー詳細: {:?}", e);
                return Err(anyhow::anyhow!("データベース接続エラー: {}", e));
            }
        };

        // SQLx標準マイグレーション実行
        println!("🚀 SQLxマイグレーション実行中...");
        match MIGRATOR.run(&pool).await {
            Ok(_) => {
                println!("✅ SQLxマイグレーション完了");
            }
            Err(e) => {
                println!("❌ SQLxマイグレーションエラー: {}", e);
                return Err(anyhow::anyhow!("マイグレーション失敗: {}", e));
            }
        }

        // テーブル作成確認
        let table_check: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='clipboard_items'",
        )
        .fetch_one(&pool)
        .await?;
        println!("📈 clipboard_itemsテーブルの存在チェック: {}", table_check);

        let db = Self { pool };

        Ok(db)
    }

    /// データベースファイルのパスを取得
    async fn get_database_path() -> Result<PathBuf> {
        // プロジェクトルートのdataディレクトリを使用（src-tauriの外）
        let current_dir = std::env::current_dir()?;
        let app_dir = current_dir.join("data");
        Ok(app_dir.join("clipone.db"))
    }

    /// 正規化されたデータベースでクリップボードアイテムとコンテンツを保存
    pub async fn save_clipboard_item_normalized(
        &self,
        primary_format: &str,
        source_app: Option<&str>,
        format_contents: &std::collections::HashMap<String, String>,
    ) -> Result<ClipboardItem> {
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp_millis();
        let created_at = Utc::now();

        // アイテムレコードを保存
        sqlx::query(
            "INSERT INTO clipboard_items (id, primary_format, timestamp, is_favorite, source_app, created_at)
             VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(primary_format)
        .bind(timestamp)
        .bind(false)
        .bind(source_app)
        .bind(created_at)
        .execute(&self.pool)
        .await?;

        // 各形式のコンテンツを保存
        for (format, content) in format_contents {
            let data_size = content.len() as i64;
            sqlx::query(
                "INSERT INTO clipboard_contents (item_id, format, content, data_size, created_at)
                 VALUES (?, ?, ?, ?, ?)",
            )
            .bind(&id)
            .bind(format)
            .bind(content)
            .bind(data_size)
            .bind(created_at)
            .execute(&self.pool)
            .await?;
        }

        // 保存したアイテムを取得して返す
        self.get_item_by_id(&id).await
    }

    /// 履歴を取得（正規化されたデータベース用）
    pub async fn get_history(
        &self,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<Vec<ClipboardItem>> {
        let limit = limit.unwrap_or(100);
        let offset = offset.unwrap_or(0);

        let items = sqlx::query(
            "SELECT id, primary_format, timestamp, is_favorite, source_app, created_at
             FROM clipboard_items
             ORDER BY timestamp DESC
             LIMIT ? OFFSET ?",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for item_row in items {
            let item_id: String = item_row.get("id");

            // コンテンツを取得
            let contents = sqlx::query(
                "SELECT item_id, format, content, data_size, created_at
                 FROM clipboard_contents
                 WHERE item_id = ?
                 ORDER BY format",
            )
            .bind(&item_id)
            .fetch_all(&self.pool)
            .await?
            .into_iter()
            .map(|row| ClipboardContent {
                item_id: row.get("item_id"),
                format: row.get("format"),
                content: row.get("content"),
                data_size: row.get("data_size"),
                created_at: row.get("created_at"),
            })
            .collect();

            result.push(ClipboardItem {
                id: item_id,
                primary_format: item_row.get("primary_format"),
                timestamp: item_row.get("timestamp"),
                is_favorite: item_row.get("is_favorite"),
                source_app: item_row.get("source_app"),
                created_at: item_row.get("created_at"),
                contents,
            });
        }

        Ok(result)
    }

    /// フロントエンド互換性のためのDisplayClipboardItemを取得
    pub async fn get_display_history(
        &self,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<Vec<DisplayClipboardItem>> {
        let items = self.get_history(limit, offset).await?;

        let mut result = Vec::new();
        for item in items {
            let available_formats: Vec<String> =
                item.contents.iter().map(|c| c.format.clone()).collect();
            let format_contents: std::collections::HashMap<String, String> = item
                .contents
                .iter()
                .map(|c| (c.format.clone(), c.content.clone()))
                .collect();

            // プライマリコンテンツを取得
            let primary_content = format_contents
                .get(&item.primary_format)
                .cloned()
                .unwrap_or_else(|| "[No content]".to_string());

            result.push(DisplayClipboardItem {
                id: item.id,
                content: primary_content,
                content_type: item.primary_format.clone(),
                timestamp: item.timestamp,
                is_favorite: item.is_favorite,
                source_app: item.source_app,
                created_at: item.created_at,
                available_formats: Some(available_formats),
                format_contents: Some(format_contents),
            });
        }

        Ok(result)
    }

    /// 全文検索で履歴を検索（正規化されたデータベース用）
    pub async fn search_history(
        &self,
        query: &str,
        limit: Option<u32>,
    ) -> Result<Vec<ClipboardItem>> {
        let limit = limit.unwrap_or(50);

        let item_ids: Vec<String> = sqlx::query_scalar(
            "SELECT DISTINCT cs.item_id
             FROM clipboard_search cs
             JOIN clipboard_items ci ON cs.item_id = ci.id
             WHERE clipboard_search MATCH ?
             ORDER BY ci.timestamp DESC
             LIMIT ?",
        )
        .bind(query)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        let mut result = Vec::new();
        for item_id in item_ids {
            if let Ok(item) = self.get_item_by_id(&item_id).await {
                result.push(item);
            }
        }

        Ok(result)
    }

    /// IDでアイテムを取得（正規化されたデータベース用）
    pub async fn get_item_by_id(&self, id: &str) -> Result<ClipboardItem> {
        let item_row = sqlx::query(
            "SELECT id, primary_format, timestamp, is_favorite, source_app, created_at
             FROM clipboard_items
             WHERE id = ?",
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await?;

        let contents = sqlx::query(
            "SELECT item_id, format, content, data_size, created_at
             FROM clipboard_contents
             WHERE item_id = ?
             ORDER BY format",
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await?
        .into_iter()
        .map(|row| ClipboardContent {
            item_id: row.get("item_id"),
            format: row.get("format"),
            content: row.get("content"),
            data_size: row.get("data_size"),
            created_at: row.get("created_at"),
        })
        .collect();

        Ok(ClipboardItem {
            id: item_row.get("id"),
            primary_format: item_row.get("primary_format"),
            timestamp: item_row.get("timestamp"),
            is_favorite: item_row.get("is_favorite"),
            source_app: item_row.get("source_app"),
            created_at: item_row.get("created_at"),
            contents,
        })
    }

    /// お気に入りの切り替え
    pub async fn toggle_favorite(&self, id: &str) -> Result<bool> {
        let current: bool =
            sqlx::query_scalar("SELECT is_favorite FROM clipboard_items WHERE id = ?")
                .bind(id)
                .fetch_one(&self.pool)
                .await?;

        let new_favorite = !current;

        sqlx::query("UPDATE clipboard_items SET is_favorite = ? WHERE id = ?")
            .bind(new_favorite)
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(new_favorite)
    }

    /// アイテム削除
    pub async fn delete_item(&self, id: &str) -> Result<()> {
        // 外部キー制約でclipboard_contentsは自動削除される
        sqlx::query("DELETE FROM clipboard_items WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// 履歴をクリア（正規化されたデータベース用）
    pub async fn clear_history(&self) -> Result<()> {
        // 外部キー制約でclipboard_contentsは自動削除される
        sqlx::query("DELETE FROM clipboard_items")
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// 履歴件数を取得
    pub async fn get_item_count(&self) -> Result<i64> {
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM clipboard_items")
            .fetch_one(&self.pool)
            .await?;

        Ok(count)
    }

    /// 古いアイテムをクリーンアップ（お気に入り以外）
    pub async fn cleanup_old_items(&self, max_items: usize) -> Result<()> {
        sqlx::query(
            "DELETE FROM clipboard_items 
             WHERE id NOT IN (
                 SELECT id FROM clipboard_items 
                 WHERE is_favorite = true
                 UNION ALL
                 SELECT id FROM clipboard_items 
                 ORDER BY timestamp DESC 
                 LIMIT ?
             )",
        )
        .bind(max_items as i64)
        .execute(&self.pool)
        .await?;

        // データベースを最適化
        sqlx::query("VACUUM").execute(&self.pool).await?;

        Ok(())
    }

    /// 後方互換性のための旧形式インターフェース（単一コンテンツ）
    pub async fn save_clipboard_item(
        &self,
        content: &str,
        content_type: &str,
        source_app: Option<&str>,
    ) -> Result<DisplayClipboardItem> {
        // 単一形式のコンテンツを正規化されたメソッドで保存
        let mut format_contents = std::collections::HashMap::new();
        format_contents.insert(content_type.to_string(), content.to_string());

        let item = self
            .save_clipboard_item_normalized(content_type, source_app, &format_contents)
            .await?;

        // DisplayClipboardItemに変換して返す
        let available_formats: Vec<String> =
            item.contents.iter().map(|c| c.format.clone()).collect();
        let format_contents_map: std::collections::HashMap<String, String> = item
            .contents
            .iter()
            .map(|c| (c.format.clone(), c.content.clone()))
            .collect();

        Ok(DisplayClipboardItem {
            id: item.id,
            content: content.to_string(),
            content_type: content_type.to_string(),
            timestamp: item.timestamp,
            is_favorite: item.is_favorite,
            source_app: item.source_app,
            created_at: item.created_at,
            available_formats: Some(available_formats),
            format_contents: Some(format_contents_map),
        })
    }

    /// 後方互換性のための旧形式インターフェース（複数コンテンツ）
    pub async fn save_clipboard_item_with_all_formats(
        &self,
        content: &str,
        content_type: &str,
        source_app: Option<&str>,
        _available_formats: &[String],
        primary_format: &str,
        format_contents: &std::collections::HashMap<String, String>,
    ) -> Result<DisplayClipboardItem> {
        let item = self
            .save_clipboard_item_normalized(primary_format, source_app, format_contents)
            .await?;

        // DisplayClipboardItemに変換して返す
        let available_formats_vec: Vec<String> =
            item.contents.iter().map(|c| c.format.clone()).collect();
        let format_contents_map: std::collections::HashMap<String, String> = item
            .contents
            .iter()
            .map(|c| (c.format.clone(), c.content.clone()))
            .collect();

        Ok(DisplayClipboardItem {
            id: item.id,
            content: content.to_string(),
            content_type: content_type.to_string(),
            timestamp: item.timestamp,
            is_favorite: item.is_favorite,
            source_app: item.source_app,
            created_at: item.created_at,
            available_formats: Some(available_formats_vec),
            format_contents: Some(format_contents_map),
        })
    }
}
