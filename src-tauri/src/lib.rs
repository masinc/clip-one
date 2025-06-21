use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::Manager;

mod database;
mod commands;
mod clipboard_monitor;

use database::Database;
use commands::*;
use clipboard_monitor::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard::init())
        .setup(|app| {
            // データベース接続を初期化
            let app_handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                match Database::new().await {
                    Ok(database) => {
                        // データベースを状態管理に追加
                        app_handle.manage(Arc::new(Mutex::new(database)));
                        println!("データベース接続が正常に初期化されました");
                    }
                    Err(e) => {
                        eprintln!("データベース初期化エラー: {}", e);
                        std::process::exit(1);
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // クリップボード操作
            get_clipboard_text,
            set_clipboard_text,
            start_clipboard_monitoring,
            stop_clipboard_monitoring,
            get_clipboard_monitoring_status,
            has_clipboard_text,
            clear_clipboard,
            save_clipboard_item,
            check_duplicate_content,
            
            // クリップボード監視サービス
            start_clipboard_monitoring_service,
            stop_clipboard_monitoring_service,
            get_clipboard_monitoring_service_status,
            
            // 履歴管理
            get_clipboard_history,
            search_clipboard_history,
            get_clipboard_item,
            toggle_favorite,
            delete_clipboard_item,
            clear_clipboard_history,
            get_clipboard_stats,
            cleanup_old_items,
            
            // 設定管理
            get_app_settings,
            save_app_settings,
            update_setting,
            reset_settings,
            
            // エクスポート/インポート
            export_clipboard_history_json,
            export_clipboard_history_csv,
            import_clipboard_history_json,
            save_export_file,
            load_import_file,
            get_export_formats,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}