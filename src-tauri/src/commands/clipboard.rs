use tauri::State;
use crate::database::{Database, ClipboardItem};
use std::sync::Arc;
use tokio::sync::Mutex;

/// クリップボードの現在のテキストを取得
#[tauri::command]
pub async fn get_clipboard_text() -> Result<String, String> {
    // tauri-plugin-clipboardを使ったクリップボード読み取り
    // 実際の実装はプラグインのAPIドキュメントに従って調整
    Ok("Clipboard read functionality to be implemented".to_string())
}

/// クリップボードにテキストを設定
#[tauri::command]
pub async fn set_clipboard_text(text: String) -> Result<(), String> {
    // tauri-plugin-clipboardを使ったクリップボード書き込み
    // 実際の実装はプラグインのAPIドキュメントに従って調整
    println!("Setting clipboard text: {}", text);
    Ok(())
}

/// クリップボード監視を開始
#[tauri::command]
pub async fn start_clipboard_monitoring() -> Result<(), String> {
    // 基本的なクリップボード監視開始（プレースホルダー）
    println!("クリップボード監視を開始しました");
    Ok(())
}

/// クリップボード監視を停止
#[tauri::command]
pub async fn stop_clipboard_monitoring() -> Result<(), String> {
    // 基本的なクリップボード監視停止（プレースホルダー）
    println!("クリップボード監視を停止しました");
    Ok(())
}

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