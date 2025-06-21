use sqlx::{sqlite::SqlitePool, Row};
use std::path::PathBuf;
use anyhow::Result;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
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
}

/// データベース接続とマイグレーション管理
pub struct Database {
    pool: SqlitePool,
}

impl Database {
    /// データベース接続を初期化
    pub async fn new() -> Result<Self> {
        let db_path = Self::get_database_path().await?;
        
        // データベースディレクトリを作成
        if let Some(parent) = db_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let database_url = format!("sqlite://{}", db_path.display());
        
        let pool = SqlitePool::connect(&database_url).await?;
        
        // マイグレーション実行
        let mut db = Self { pool };
        db.run_migrations().await?;
        
        Ok(db)
    }

    /// データベースファイルのパスを取得
    async fn get_database_path() -> Result<PathBuf> {
        // Tauriの推奨方法: 実行ファイルと同じディレクトリにdataフォルダを作成
        let exe_dir = std::env::current_exe()?
            .parent()
            .ok_or_else(|| anyhow::anyhow!("実行ファイルの親ディレクトリが取得できません"))?
            .to_path_buf();
        
        let app_dir = exe_dir.join("data");
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
            )"
        )
        .execute(&self.pool)
        .await?;

        // バージョン1のマイグレーションが適用済みかチェック
        let version_exists: bool = sqlx::query_scalar("SELECT 1 FROM schema_version WHERE version = 1")
            .fetch_optional(&self.pool)
            .await?
            .unwrap_or(false);

        if !version_exists {
            // マイグレーションを実行
            sqlx::query(migration_sql)
                .execute(&self.pool)
                .await?;

            // バージョンを記録
            sqlx::query("INSERT INTO schema_version (version) VALUES (1)")
                .execute(&self.pool)
                .await?;
        }

        Ok(())
    }

    /// クリップボードアイテムを保存
    pub async fn save_clipboard_item(&self, content: &str, content_type: &str, source_app: Option<&str>) -> Result<ClipboardItem> {
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
    pub async fn get_history(&self, limit: Option<u32>, offset: Option<u32>) -> Result<Vec<ClipboardItem>> {
        let limit = limit.unwrap_or(100);
        let offset = offset.unwrap_or(0);

        let rows = sqlx::query(
            "SELECT id, content, content_type, timestamp, is_favorite, source_app, created_at
             FROM clipboard_items
             ORDER BY timestamp DESC
             LIMIT ? OFFSET ?"
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(&self.pool)
        .await?;

        let items = rows.into_iter().map(|row| {
            ClipboardItem {
                id: row.get("id"),
                content: row.get("content"),
                content_type: row.get("content_type"),
                timestamp: row.get("timestamp"),
                is_favorite: row.get("is_favorite"),
                source_app: row.get("source_app"),
                created_at: row.get("created_at"),
            }
        }).collect();

        Ok(items)
    }

    /// 全文検索で履歴を検索
    pub async fn search_history(&self, query: &str, limit: Option<u32>) -> Result<Vec<ClipboardItem>> {
        let limit = limit.unwrap_or(50);

        let rows = sqlx::query(
            "SELECT ci.id, ci.content, ci.content_type, ci.timestamp, ci.is_favorite, ci.source_app, ci.created_at
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

        let items = rows.into_iter().map(|row| {
            ClipboardItem {
                id: row.get("id"),
                content: row.get("content"),
                content_type: row.get("content_type"),
                timestamp: row.get("timestamp"),
                is_favorite: row.get("is_favorite"),
                source_app: row.get("source_app"),
                created_at: row.get("created_at"),
            }
        }).collect();

        Ok(items)
    }

    /// お気に入りの切り替え
    pub async fn toggle_favorite(&self, id: &str) -> Result<bool> {
        let current: bool = sqlx::query_scalar("SELECT is_favorite FROM clipboard_items WHERE id = ?")
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
             )"
        )
        .bind(max_items as i64)
        .execute(&self.pool)
        .await?;

        // データベースを最適化
        sqlx::query("VACUUM")
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}