use tauri::State;
use crate::database::{Database, ClipboardItem};
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

/// エクスポート用のデータ構造
#[derive(Serialize, Deserialize)]
pub struct ExportData {
    pub version: String,
    pub exported_at: DateTime<Utc>,
    pub total_items: usize,
    pub items: Vec<ClipboardItem>,
}

/// クリップボード履歴をJSONフォーマットでエクスポート
#[tauri::command]
pub async fn export_clipboard_history_json(
    db_state: State<'_, Arc<Mutex<Database>>>,
) -> Result<String, String> {
    let db = db_state.lock().await;
    let items = db.get_history(None, None)
        .await
        .map_err(|e| format!("履歴取得エラー: {}", e))?;

    let export_data = ExportData {
        version: "1.0.0".to_string(),
        exported_at: Utc::now(),
        total_items: items.len(),
        items,
    };

    serde_json::to_string_pretty(&export_data)
        .map_err(|e| format!("JSONシリアライゼーションエラー: {}", e))
}

/// クリップボード履歴をCSVフォーマットでエクスポート
#[tauri::command]
pub async fn export_clipboard_history_csv(
    db_state: State<'_, Arc<Mutex<Database>>>,
) -> Result<String, String> {
    let db = db_state.lock().await;
    let items = db.get_history(None, None)
        .await
        .map_err(|e| format!("履歴取得エラー: {}", e))?;

    let mut csv_content = String::new();
    csv_content.push_str("ID,Content,ContentType,Timestamp,IsFavorite,SourceApp,CreatedAt\n");

    for item in items {
        // CSVエスケープ処理
        let escaped_content = escape_csv_field(&item.content);
        let source_app = item.source_app.as_deref().unwrap_or("");
        
        csv_content.push_str(&format!(
            "{},{},{},{},{},{},{}\n",
            item.id,
            escaped_content,
            item.content_type,
            item.timestamp,
            item.is_favorite,
            source_app,
            item.created_at.to_rfc3339()
        ));
    }

    Ok(csv_content)
}

/// JSONからクリップボード履歴をインポート
#[tauri::command]
pub async fn import_clipboard_history_json(
    db_state: State<'_, Arc<Mutex<Database>>>,
    json_data: String,
) -> Result<usize, String> {
    let export_data: ExportData = serde_json::from_str(&json_data)
        .map_err(|e| format!("JSONデシリアライゼーションエラー: {}", e))?;

    let db = db_state.lock().await;
    let mut imported_count = 0;

    for item in export_data.items {
        // 重複チェック
        let existing_items = db.get_history(Some(1000), None)
            .await
            .map_err(|e| format!("既存履歴取得エラー: {}", e))?;

        let is_duplicate = existing_items.iter().any(|existing| {
            existing.content == item.content && existing.timestamp == item.timestamp
        });

        if !is_duplicate {
            let _saved_item = db.save_clipboard_item(
                &item.content,
                &item.content_type,
                item.source_app.as_deref()
            )
            .await
            .map_err(|e| format!("アイテム保存エラー: {}", e))?;
            
            imported_count += 1;
        }
    }

    Ok(imported_count)
}

/// エクスポートファイルを指定パスに保存
#[tauri::command]
pub async fn save_export_file(
    file_path: String,
    content: String,
) -> Result<(), String> {
    tokio::fs::write(&file_path, content)
        .await
        .map_err(|e| format!("ファイル保存エラー: {}", e))
}

/// インポートファイルを読み込み
#[tauri::command]
pub async fn load_import_file(file_path: String) -> Result<String, String> {
    tokio::fs::read_to_string(&file_path)
        .await
        .map_err(|e| format!("ファイル読み込みエラー: {}", e))
}

/// CSVフィールドをエスケープする補助関数
fn escape_csv_field(field: &str) -> String {
    if field.contains(',') || field.contains('"') || field.contains('\n') {
        format!("\"{}\"", field.replace('"', "\"\""))
    } else {
        field.to_string()
    }
}

/// エクスポート可能な形式一覧を取得
#[tauri::command]
pub async fn get_export_formats() -> Result<Vec<ExportFormat>, String> {
    Ok(vec![
        ExportFormat {
            id: "json".to_string(),
            name: "JSON".to_string(),
            description: "構造化されたJSONフォーマット".to_string(),
            extension: "json".to_string(),
        },
        ExportFormat {
            id: "csv".to_string(),
            name: "CSV".to_string(),
            description: "カンマ区切りファイル（Excel対応）".to_string(),
            extension: "csv".to_string(),
        },
    ])
}

/// エクスポート形式の定義
#[derive(Serialize)]
pub struct ExportFormat {
    pub id: String,
    pub name: String,
    pub description: String,
    pub extension: String,
}