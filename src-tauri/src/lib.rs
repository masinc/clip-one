use std::sync::Arc;
use tauri::{image::Image, menu::{Menu, MenuItem, PredefinedMenuItem}, tray::{MouseButton, TrayIconBuilder, TrayIconEvent}, Manager, WindowEvent, Emitter};
use tokio::sync::Mutex;
use image::GenericImageView;

mod commands;
mod database;

use commands::*;
use database::Database;

/// システムトレイの設定
fn setup_system_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // トレイメニューを作成
    let show_hide = MenuItem::with_id(app, "toggle_window", "表示/非表示", true, None::<&str>)?;
    let clear_history = MenuItem::with_id(app, "clear_history", "履歴をクリア", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
    
    let menu = Menu::with_items(app, &[&show_hide, &clear_history, &separator, &quit])?;
    
    // トレイアイコンを作成（既存の32x32アイコンを使用）
    let icon_bytes = include_bytes!("../icons/32x32.png");
    let img = image::load_from_memory(icon_bytes)?;
    let rgba = img.to_rgba8();
    let (width, height) = img.dimensions();
    let icon = Image::new_owned(rgba.into_raw(), width, height);
    
    let _tray = TrayIconBuilder::with_id("main-tray")
        .menu(&menu)
        .icon(icon)
        .tooltip("ClipOne - クリップボード履歴管理")
        .on_tray_icon_event(|tray, event| {
            match event {
                TrayIconEvent::Click { button: MouseButton::Left, .. } => {
                    // 左クリック：ウィンドウの表示/非表示切り替え
                    if let Some(app) = tray.app_handle().get_webview_window("main") {
                        if app.is_visible().unwrap_or(false) {
                            let _ = app.hide();
                        } else {
                            let _ = app.show();
                            let _ = app.set_focus();
                        }
                    }
                }
                _ => {}
            }
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "toggle_window" => {
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                "clear_history" => {
                    // 履歴クリア - 既存のコマンドを呼び出し
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("tray-clear-history", ());
                    }
                }
                "quit" => {
                    println!("✋ アプリケーションを終了します");
                    app.exit(0);
                }
                _ => {}
            }
        })
        .build(app)?;
    
    println!("✅ システムトレイが初期化されました");
    Ok(())
}

/// ウィンドウイベントの設定
fn setup_window_events(app: &tauri::App) {
    if let Some(window) = app.get_webview_window("main") {
        let app_handle = app.handle().clone();
        let _ = window.on_window_event(move |event| {
            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    // ウィンドウクローズ時は隠すだけ（終了しない）
                    api.prevent_close();
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.hide();
                        println!("🔽 ウィンドウをトレイに最小化しました");
                    }
                }
                _ => {}
            }
        });
    }
}

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
                    
                    // トレイアイコンとメニューの設定
                    setup_system_tray(app)?;
                    
                    // ウィンドウクローズ時の処理設定
                    setup_window_events(app);
                    
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
