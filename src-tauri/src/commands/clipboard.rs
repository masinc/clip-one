use tauri::State;
use crate::database::{Database, ClipboardItem};
use std::sync::Arc;
use tokio::sync::Mutex;

/// クリップボードアイテムをデータベースに保存
#[tauri::command]
pub async fn save_clipboard_item(
    db_state: State<'_, Arc<Mutex<Database>>>,
    content: String,
    content_type: Option<String>,
    source_app: Option<String>,
) -> Result<ClipboardItem, String> {
    let db = db_state.lock().await;
    let content_type = content_type.unwrap_or_else(|| {
        // コンテンツタイプを自動判定
        if content.starts_with("http://") || content.starts_with("https://") {
            "url".to_string()
        } else if content.starts_with("data:image/") {
            "image".to_string()
        } else if content.contains("<html") || content.contains("</html>") {
            "html".to_string()
        } else {
            "text".to_string()
        }
    });

    db.save_clipboard_item(&content, &content_type, source_app.as_deref())
        .await
        .map_err(|e| format!("データベース保存エラー: {}", e))
}

/// 重複チェック（同じコンテンツが既に存在するかチェック）
#[tauri::command]
pub async fn check_duplicate_content(
    db_state: State<'_, Arc<Mutex<Database>>>,
    content: String,
) -> Result<bool, String> {
    let db = db_state.lock().await;
    
    // 最近の10件をチェックして重複を確認
    let recent_items = db.get_history(Some(10), None)
        .await
        .map_err(|e| format!("履歴取得エラー: {}", e))?;

    let is_duplicate = recent_items.iter().any(|item| item.content == content);
    Ok(is_duplicate)
}