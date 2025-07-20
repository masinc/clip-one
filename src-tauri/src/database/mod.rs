use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePool, Row};
use std::path::PathBuf;
use uuid::Uuid;

/// クリップボードアイテムの構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardItem {
    pub id: String,
    pub content: String,
    pub content_type: String,
    pub timestamp: i64,
    pub is_favorite: bool,
    pub source_app: Option<String>,
    pub created_at: DateTime<Utc>,
    pub available_formats: Option<String>,
    pub primary_format: Option<String>,
    pub data_size: Option<i64>,
    pub format_contents: Option<String>,
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

        // マイグレーション実行
        let mut db = Self { pool };
        db.run_migrations().await?;

        Ok(db)
    }

    /// データベースファイルのパスを取得
    async fn get_database_path() -> Result<PathBuf> {
        // プロジェクトルートのdataディレクトリを使用（src-tauriの外）
        let current_dir = std::env::current_dir()?;
        let app_dir = current_dir.join("data");
        Ok(app_dir.join("clipone.db"))
    }

    /// マイグレーションを実行
    async fn run_migrations(&mut self) -> Result<()> {
        // 埋め込まれたマイグレーションファイルを実行
        let migration_sql = include_str!("../../migrations/001_initial.sql");

        // スキーマバージョンテーブルを作成
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
        )
        .execute(&self.pool)
        .await?;

        // バージョン1のマイグレーションが適用済みかチェック
        let version_exists: bool =
            sqlx::query_scalar("SELECT 1 FROM schema_version WHERE version = 1")
                .fetch_optional(&self.pool)
                .await?
                .unwrap_or(false);

        if !version_exists {
            // マイグレーションを実行
            sqlx::query(migration_sql).execute(&self.pool).await?;

            // バージョンを記録
            sqlx::query("INSERT INTO schema_version (version) VALUES (1)")
                .execute(&self.pool)
                .await?;
        }

        // バージョン2のマイグレーション（形式サポート拡張）
        let migration_sql_v2 = include_str!("../../migrations/002_format_support.sql");
        
        let version_2_exists: bool =
            sqlx::query_scalar("SELECT 1 FROM schema_version WHERE version = 2")
                .fetch_optional(&self.pool)
                .await?
                .unwrap_or(false);

        if !version_2_exists {
            // マイグレーションを実行
            sqlx::query(migration_sql_v2).execute(&self.pool).await?;

            // バージョンを記録
            sqlx::query("INSERT INTO schema_version (version) VALUES (2)")
                .execute(&self.pool)
                .await?;
        }

        // バージョン3のマイグレーション（複数形式コンテンツ）
        let migration_sql_v3 = include_str!("../../migrations/003_multiple_formats.sql");
        
        let version_3_exists: bool =
            sqlx::query_scalar("SELECT 1 FROM schema_version WHERE version = 3")
                .fetch_optional(&self.pool)
                .await?
                .unwrap_or(false);

        if !version_3_exists {
            // マイグレーションを実行
            sqlx::query(migration_sql_v3).execute(&self.pool).await?;

            // バージョンを記録
            sqlx::query("INSERT INTO schema_version (version) VALUES (3)")
                .execute(&self.pool)
                .await?;
        }

        Ok(())
    }

    /// クリップボードアイテムを保存（拡張版：複数形式コンテンツ対応）
    pub async fn save_clipboard_item_with_all_formats(
        &self,
        content: &str,
        content_type: &str,
        source_app: Option<&str>,
        available_formats: &[String],
        primary_format: &str,
        format_contents: &std::collections::HashMap<String, String>,
    ) -> Result<ClipboardItem> {
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp_millis();
        let created_at = Utc::now();
        let data_size = content.len() as i64;
        let formats_json = serde_json::to_string(available_formats).unwrap_or_else(|_| "[]".to_string());
        let contents_json = serde_json::to_string(format_contents).unwrap_or_else(|_| "{}".to_string());

        let item = ClipboardItem {
            id: id.clone(),
            content: content.to_string(),
            content_type: content_type.to_string(),
            timestamp,
            is_favorite: false,
            source_app: source_app.map(|s| s.to_string()),
            created_at,
            available_formats: Some(formats_json.clone()),
            primary_format: Some(primary_format.to_string()),
            data_size: Some(data_size),
            format_contents: Some(contents_json.clone()),
        };

        sqlx::query(
            r#"
            INSERT INTO clipboard_items (
                id, content, content_type, timestamp, is_favorite, source_app,
                available_formats, primary_format, data_size, format_contents
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            "#
        )
        .bind(&id)
        .bind(content)
        .bind(content_type)
        .bind(timestamp)
        .bind(false)
        .bind(source_app)
        .bind(&formats_json)
        .bind(primary_format)
        .bind(data_size)
        .bind(&contents_json)
        .execute(&self.pool)
        .await?;

        Ok(item)
    }

    /// クリップボードアイテムを保存（拡張版）
    pub async fn save_clipboard_item_with_formats(
        &self,
        content: &str,
        content_type: &str,
        source_app: Option<&str>,
        available_formats: &[String],
        primary_format: &str,
    ) -> Result<ClipboardItem> {
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp_millis();
        let created_at = Utc::now();
        let data_size = content.len() as i64;
        let formats_json = serde_json::to_string(available_formats).unwrap_or_else(|_| "[]".to_string());

        let item = ClipboardItem {
            id: id.clone(),
            content: content.to_string(),
            content_type: content_type.to_string(),
            timestamp,
            is_favorite: false,
            source_app: source_app.map(String::from),
            created_at,
            available_formats: Some(formats_json.clone()),
            primary_format: Some(primary_format.to_string()),
            data_size: Some(data_size),
            format_contents: None, // この関数では format_contents は保存しない
        };

        sqlx::query(
            "INSERT INTO clipboard_items (id, content, content_type, timestamp, is_favorite, source_app, created_at, available_formats, primary_format, data_size)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&item.id)
        .bind(&item.content)
        .bind(&item.content_type)
        .bind(item.timestamp)
        .bind(item.is_favorite)
        .bind(&item.source_app)
        .bind(&item.created_at)
        .bind(&formats_json)
        .bind(primary_format)
        .bind(data_size)
        .execute(&self.pool)
        .await?;

        Ok(item)
    }

    /// クリップボードアイテムを保存（従来版 - 後方互換性のため）
    pub async fn save_clipboard_item(
        &self,
        content: &str,
        content_type: &str,
        source_app: Option<&str>,
    ) -> Result<ClipboardItem> {
        let id = Uuid::new_v4().to_string();
        let timestamp = Utc::now().timestamp_millis();
        let created_at = Utc::now();

        let item = ClipboardItem {
            id: id.clone(),
            content: content.to_string(),
            content_type: content_type.to_string(),
            timestamp,
            is_favorite: false,
            source_app: source_app.map(String::from),
            created_at,
            available_formats: None,
            primary_format: None,
            data_size: None,
            format_contents: None,
        };

        sqlx::query(
            "INSERT INTO clipboard_items (id, content, content_type, timestamp, is_favorite, source_app, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&item.id)
        .bind(&item.content)
        .bind(&item.content_type)
        .bind(item.timestamp)
        .bind(item.is_favorite)
        .bind(&item.source_app)
        .bind(item.created_at)
        .execute(&self.pool)
        .await?;

        Ok(item)
    }

    /// 履歴を取得（ページネーション対応）
    pub async fn get_history(
        &self,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<Vec<ClipboardItem>> {
        let limit = limit.unwrap_or(100);
        let offset = offset.unwrap_or(0);

        let rows = sqlx::query(
            "SELECT id, content, content_type, timestamp, is_favorite, source_app, created_at,
                    available_formats, primary_format, data_size, format_contents
             FROM clipboard_items
             ORDER BY timestamp DESC
             LIMIT ? OFFSET ?",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let items = rows
            .into_iter()
            .map(|row| ClipboardItem {
                id: row.get("id"),
                content: row.get("content"),
                content_type: row.get("content_type"),
                timestamp: row.get("timestamp"),
                is_favorite: row.get("is_favorite"),
                source_app: row.get("source_app"),
                created_at: row.get("created_at"),
                available_formats: row.try_get("available_formats").ok(),
                primary_format: row.try_get("primary_format").ok(),
                data_size: row.try_get("data_size").ok(),
                format_contents: row.try_get("format_contents").ok(),
            })
            .collect();

        Ok(items)
    }

    /// 全文検索で履歴を検索
    pub async fn search_history(
        &self,
        query: &str,
        limit: Option<u32>,
    ) -> Result<Vec<ClipboardItem>> {
        let limit = limit.unwrap_or(50);

        let rows = sqlx::query(
            "SELECT ci.id, ci.content, ci.content_type, ci.timestamp, ci.is_favorite, ci.source_app, ci.created_at,
                    ci.available_formats, ci.primary_format, ci.data_size, ci.format_contents
             FROM clipboard_items ci
             JOIN clipboard_search cs ON ci.rowid = cs.rowid
             WHERE clipboard_search MATCH ?
             ORDER BY ci.timestamp DESC
             LIMIT ?"
        )
        .bind(query)
        .bind(limit)
        .fetch_all(&self.pool)
        .await?;

        let items = rows
            .into_iter()
            .map(|row| ClipboardItem {
                id: row.get("id"),
                content: row.get("content"),
                content_type: row.get("content_type"),
                timestamp: row.get("timestamp"),
                is_favorite: row.get("is_favorite"),
                source_app: row.get("source_app"),
                created_at: row.get("created_at"),
                available_formats: row.try_get("available_formats").ok(),
                primary_format: row.try_get("primary_format").ok(),
                data_size: row.try_get("data_size").ok(),
                format_contents: row.try_get("format_contents").ok(),
            })
            .collect();

        Ok(items)
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
        sqlx::query("DELETE FROM clipboard_items WHERE id = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    /// 履歴をクリア
    pub async fn clear_history(&self) -> Result<()> {
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
}
