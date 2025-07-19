use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

mod commands;
mod database;

use commands::*;
use database::Database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // データベース接続を初期化（同期的に実行）
            let runtime = tokio::runtime::Runtime::new().unwrap();
            let database = runtime.block_on(async { Database::new().await });

            match database {
                Ok(db) => {
                    // データベースを状態管理に追加
                    let db_state = Arc::new(Mutex::new(db));
                    app.manage(db_state);
                    println!("データベース接続が正常に初期化されました");
                    println!("クリップボード監視はフロントエンドで開始されます");
                    Ok(())
                }
                Err(e) => {
                    eprintln!("データベース初期化エラー: {}", e);
                    Err(e.into())
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // テスト用
            test_command,
            add_test_data,
            // クリップボード操作（データベース連携）
            save_clipboard_item,
            check_duplicate_content,
            start_clipboard_monitoring,
            stop_clipboard_monitoring,
            get_monitoring_status,
            test_clipboard_rs,
            // クリップボード基本操作
            get_clipboard_text,
            set_clipboard_text,
            has_clipboard_text,
            clear_clipboard_text,
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
