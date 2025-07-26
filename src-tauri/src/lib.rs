use image::GenericImageView;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager, WindowEvent,
};
use tokio::sync::Mutex;

// ウィンドウの表示状態を管理
static WINDOW_SHOULD_BE_VISIBLE: AtomicBool = AtomicBool::new(false);

mod commands;
mod database;

use commands::*;
use database::Database;

/// システムトレイの設定
fn setup_system_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // トレイメニューを作成
    let show_hide = MenuItem::with_id(
        app,
        "toggle_window",
        "履歴の表示/非表示",
        true,
        None::<&str>,
    )?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let settings = MenuItem::with_id(app, "settings", "設定", true, None::<&str>)?;
    let about = MenuItem::with_id(app, "about", "ClipOne について", true, None::<&str>)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_hide,
            &separator1,
            &settings,
            &about,
            &separator2,
            &quit,
        ],
    )?;

    // トレイアイコンを作成（既存の32x32アイコンを使用）
    let icon_bytes = include_bytes!("../icons/32x32.png");
    let img = image::load_from_memory(icon_bytes)?;
    let rgba = img.to_rgba8();
    let (width, height) = img.dimensions();
    let icon = Image::new_owned(rgba.into_raw(), width, height);

    let _tray = TrayIconBuilder::with_id("main-tray")
        .show_menu_on_left_click(false) // 左クリックでメニューを表示しない
        .menu(&menu)
        .icon(icon)
        .tooltip("ClipOne - クリップボード履歴管理\n左クリック: 表示切り替え\n右クリック: メニュー")
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state,
                ..
            } = event
            {
                // Down状態のクリックのみ処理（Up状態は無視）
                if button_state != MouseButtonState::Down {
                    return;
                }

                // 左クリック：ウィンドウの表示/非表示切り替え
                if let Some(window) = tray.app_handle().get_webview_window("main") {
                    // 状態をatomicフラグで管理してパフォーマンス向上
                    let should_show = !WINDOW_SHOULD_BE_VISIBLE.load(Ordering::Relaxed);

                    if should_show {
                        WINDOW_SHOULD_BE_VISIBLE.store(true, Ordering::Relaxed);
                        let _ = window.show();
                        let _ = window.set_focus();
                    } else {
                        WINDOW_SHOULD_BE_VISIBLE.store(false, Ordering::Relaxed);
                        let _ = window.hide();
                    }
                }
            }
        })
        .on_menu_event(|app, event| {
            match event.id().as_ref() {
                "toggle_window" => {
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            WINDOW_SHOULD_BE_VISIBLE.store(false, Ordering::Relaxed);
                            let _ = window.hide();
                        } else {
                            WINDOW_SHOULD_BE_VISIBLE.store(true, Ordering::Relaxed);
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                "settings" => {
                    // 設定画面を表示
                    if let Some(window) = app.get_webview_window("main") {
                        // まずウィンドウを表示
                        WINDOW_SHOULD_BE_VISIBLE.store(true, Ordering::Relaxed);
                        let _ = window.show();
                        let _ = window.set_focus();
                        // 設定ページに遷移するイベントを送信
                        let _ = window.emit("tray-navigate-settings", ());
                    }
                }
                "about" => {
                    // アバウト画面を表示
                    if let Some(window) = app.get_webview_window("main") {
                        // まずウィンドウを表示
                        WINDOW_SHOULD_BE_VISIBLE.store(true, Ordering::Relaxed);
                        let _ = window.show();
                        let _ = window.set_focus();
                        // アバウトページに遷移するイベントを送信
                        let _ = window.emit("tray-navigate-about", ());
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
        window.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // ウィンドウクローズ時は隠すだけ（終了しない）
                // ただし、トレイから意図的に表示された直後の場合は隠さない
                let should_be_visible = WINDOW_SHOULD_BE_VISIBLE.load(Ordering::Relaxed);

                println!(
                    "🚪 CloseRequested イベント受信, should_be_visible = {}",
                    should_be_visible
                );

                if should_be_visible {
                    // 意図的に表示された状態なので、クローズ処理をスキップ
                    println!("🔼 ウィンドウが意図的に表示されているため、クローズ処理をスキップ");
                    // 少し待ってからフラグをリセット（初期化後の自動クローズを防ぐ）
                    std::thread::spawn(|| {
                        std::thread::sleep(std::time::Duration::from_millis(1000));
                        WINDOW_SHOULD_BE_VISIBLE.store(false, Ordering::Relaxed);
                        println!("⏰ WINDOW_SHOULD_BE_VISIBLE フラグをリセット");
                    });
                } else {
                    // 通常のクローズ処理：トレイに隠す
                    api.prevent_close();
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.hide();
                        println!("🔽 ウィンドウをトレイに最小化しました");
                    }
                }
            }
        });
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_window_state::Builder::new().build())
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
            // アプリ情報
            get_app_info,
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
