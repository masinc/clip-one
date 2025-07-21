use crate::database::{Database, DisplayClipboardItem};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

/// クリップボード履歴を取得
#[tauri::command]
pub async fn get_clipboard_history(
    db_state: State<'_, Arc<Mutex<Database>>>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<Vec<DisplayClipboardItem>, String> {
    println!(
        "get_clipboard_history コマンド呼び出し: limit={:?}, offset={:?}",
        limit, offset
    );

    let db = db_state.lock().await;

    match db.get_display_history(limit, offset).await {
        Ok(items) => {
            println!("履歴取得成功: {} 件", items.len());
            Ok(items)
        }
        Err(e) => {
            let error_msg = format!("履歴取得エラー: {}", e);
            println!("エラー: {}", error_msg);
            Err(error_msg)
        }
    }
}

/// クリップボード履歴を検索
#[tauri::command]
pub async fn search_clipboard_history(
    db_state: State<'_, Arc<Mutex<Database>>>,
    query: String,
    limit: Option<u32>,
) -> Result<Vec<DisplayClipboardItem>, String> {
    let db = db_state.lock().await;
    // 正規化された検索結果をDisplayClipboardItemに変換
    let search_results = db.search_history(&query, limit).await
        .map_err(|e| format!("履歴検索エラー: {}", e))?;
    
    let mut display_results = Vec::new();
    for item in search_results {
        let available_formats: Vec<String> = item.contents.iter().map(|c| c.format.clone()).collect();
        let format_contents: std::collections::HashMap<String, String> = item.contents.iter()
            .map(|c| (c.format.clone(), c.content.clone()))
            .collect();
        
        let primary_content = format_contents.get(&item.primary_format)
            .cloned()
            .unwrap_or_else(|| "[No content]".to_string());

        display_results.push(DisplayClipboardItem {
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
    
    Ok(display_results)
}

/// 特定のアイテムを取得
#[tauri::command]
pub async fn get_clipboard_item(
    db_state: State<'_, Arc<Mutex<Database>>>,
    id: String,
) -> Result<Option<DisplayClipboardItem>, String> {
    let db = db_state.lock().await;
    let items = db
        .get_display_history(None, None)
        .await
        .map_err(|e| format!("履歴取得エラー: {}", e))?;

    let item = items.into_iter().find(|item| item.id == id);
    Ok(item)
}

/// お気に入りの切り替え
#[tauri::command]
pub async fn toggle_favorite(
    db_state: State<'_, Arc<Mutex<Database>>>,
    id: String,
) -> Result<bool, String> {
    let db = db_state.lock().await;
    db.toggle_favorite(&id)
        .await
        .map_err(|e| format!("お気に入り更新エラー: {}", e))
}

/// アイテムを削除
#[tauri::command]
pub async fn delete_clipboard_item(
    db_state: State<'_, Arc<Mutex<Database>>>,
    id: String,
) -> Result<(), String> {
    let db = db_state.lock().await;
    db.delete_item(&id)
        .await
        .map_err(|e| format!("アイテム削除エラー: {}", e))
}

/// 履歴をクリア
#[tauri::command]
pub async fn clear_clipboard_history(
    db_state: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    let db = db_state.lock().await;
    db.clear_history()
        .await
        .map_err(|e| format!("履歴クリアエラー: {}", e))
}

/// 履歴の統計を取得
#[tauri::command]
pub async fn get_clipboard_stats(
    db_state: State<'_, Arc<Mutex<Database>>>,
) -> Result<ClipboardStats, String> {
    let db = db_state.lock().await;

    let total_count = db
        .get_item_count()
        .await
        .map_err(|e| format!("統計取得エラー: {}", e))?;

    let items = db
        .get_display_history(None, None)
        .await
        .map_err(|e| format!("履歴取得エラー: {}", e))?;

    let favorite_count = items.iter().filter(|item| item.is_favorite).count() as i64;

    let content_type_counts = {
        let mut counts = std::collections::HashMap::new();
        for item in &items {
            *counts.entry(item.content_type.clone()).or_insert(0) += 1;
        }
        counts
    };

    Ok(ClipboardStats {
        total_items: total_count,
        favorite_items: favorite_count,
        content_type_counts,
    })
}

/// 古いアイテムをクリーンアップ
#[tauri::command]
pub async fn cleanup_old_items(
    db_state: State<'_, Arc<Mutex<Database>>>,
    max_items: usize,
) -> Result<(), String> {
    let db = db_state.lock().await;
    db.cleanup_old_items(max_items)
        .await
        .map_err(|e| format!("クリーンアップエラー: {}", e))
}

/// 履歴統計の構造体
#[derive(serde::Serialize)]
pub struct ClipboardStats {
    pub total_items: i64,
    pub favorite_items: i64,
    pub content_type_counts: std::collections::HashMap<String, i32>,
}
