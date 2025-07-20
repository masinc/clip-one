use crate::database::{ClipboardItem, Database};
use clipboard_rs::{
    Clipboard, ClipboardContext, ClipboardHandler, ClipboardWatcher, ClipboardWatcherContext,
    ContentFormat,
};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

// グローバルな監視状態
static MONITORING: AtomicBool = AtomicBool::new(false);

// shutdown_channelをグローバルで保持
use clipboard_rs::WatcherShutdown;
use std::sync::Mutex as StdMutex;
static SHUTDOWN_CHANNEL: StdMutex<Option<WatcherShutdown>> = StdMutex::new(None);

// クリップボード監視ハンドラー
pub struct ClipboardManager {
    app: AppHandle,
    db: Arc<Mutex<Database>>,
    last_content: String,
}

impl ClipboardManager {
    pub fn new(app: AppHandle, db: Arc<Mutex<Database>>) -> Self {
        let ctx = ClipboardContext::new().unwrap();
        let last_content = ctx.get_text().unwrap_or_default();

        ClipboardManager {
            app,
            db,
            last_content,
        }
    }
}

impl ClipboardHandler for ClipboardManager {
    fn on_clipboard_change(&mut self) {
        println!("🎉 clipboard-rs: クリップボード変更検出!");

        // 新しい内容を取得 - ClipboardHandlerでは毎回新しいcontextを作る必要がある
        let ctx = match ClipboardContext::new() {
            Ok(ctx) => ctx,
            Err(e) => {
                eprintln!("❌ ClipboardContext作成エラー: {}", e);
                return;
            }
        };

        // 利用可能な形式を検出
        let available_formats = detect_clipboard_formats(&ctx);
        println!("🔍 検出された形式: {:?}", available_formats);

        // 優先順位に従ってコンテンツを取得
        let (current_content, detected_format) = match get_clipboard_content_by_priority(&ctx) {
            Ok(content_info) => content_info,
            Err(e) => {
                eprintln!("❌ クリップボード読み取りエラー: {}", e);
                // フォールバック: 基本テキスト取得を試行
                match ctx.get_text() {
                    Ok(text) => {
                        println!("⚠️ フォールバック: テキストとして取得");
                        (text, "text/plain".to_string())
                    },
                    Err(text_err) => {
                        eprintln!("❌ フォールバック失敗: {}", text_err);
                        return;
                    }
                }
            }
        };

        // 重複チェック
        if current_content == self.last_content || current_content.is_empty() {
            return;
        }

        println!(
            "📝 新しい内容: {}",
            &current_content[..std::cmp::min(100, current_content.len())]
        );
        self.last_content = current_content.clone();

        // 非同期でデータベース処理を実行
        let app_clone = self.app.clone();
        let db_clone = Arc::clone(&self.db);
        let content_clone = current_content.clone();
        let format_clone = detected_format.clone();
        let formats_clone = available_formats.clone();

        // 新しいランタイムで非同期処理を実行
        std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            rt.block_on(async move {
                let db = db_clone.lock().await;

                // 重複チェック
                let recent_items = match db.get_history(Some(10), None).await {
                    Ok(items) => items,
                    Err(e) => {
                        eprintln!("❌ 履歴取得エラー: {}", e);
                        return;
                    }
                };

                let is_duplicate = recent_items
                    .iter()
                    .any(|item| item.content == content_clone);

                if !is_duplicate {
                    match db
                        .save_clipboard_item_with_formats(
                            &content_clone, 
                            &format_clone, 
                            Some("clipboard-rs"),
                            &formats_clone,
                            &format_clone
                        )
                        .await
                    {
                        Ok(saved_item) => {
                            println!("✅ データベース保存完了 ID: {}", saved_item.id);

                            // フロントエンドにイベント通知
                            if let Err(e) = app_clone.emit("clipboard-updated", &saved_item) {
                                eprintln!("❌ イベント送信エラー: {}", e);
                            } else {
                                println!("📤 フロントエンドにイベント通知成功");
                            }
                        }
                        Err(e) => {
                            eprintln!("❌ データベース保存エラー: {}", e);
                        }
                    }
                } else {
                    println!("⚠️ 重複のため保存スキップ");
                }
            });
        });
    }
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
            "text/uri-list".to_string()
        } else if content.starts_with("data:image/") {
            "image/png".to_string() // デフォルトでPNG、実際のMIMEタイプは後で解析
        } else if content.starts_with("data:") {
            "application/octet-stream".to_string()
        } else if content.contains("<html") || content.contains("</html>") {
            "text/html".to_string()
        } else if content.starts_with("{\\rtf") {
            "text/rtf".to_string()
        } else if content.contains("\n") && content.len() > 100 {
            "text/plain".to_string() // 長い複数行テキスト
        } else if content.starts_with("/") || content.starts_with("C:\\") || content.contains("\\")
        {
            "files".to_string() // ファイルパス
        } else {
            "text/plain".to_string()
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
    let recent_items = db
        .get_history(Some(10), None)
        .await
        .map_err(|e| format!("履歴取得エラー: {}", e))?;

    let is_duplicate = recent_items.iter().any(|item| item.content == content);
    Ok(is_duplicate)
}

/// clipboard-rsでクリップボード監視を開始
#[tauri::command]
pub async fn start_clipboard_monitoring(
    app: AppHandle,
    db_state: State<'_, Arc<Mutex<Database>>>,
) -> Result<(), String> {
    if MONITORING.load(Ordering::Relaxed) {
        println!("⚠️ 既に監視中です");
        return Ok(()); // 既に監視中
    }

    println!("🚀 clipboard-rs でクリップボード監視を開始...");

    // まず現在のクリップボード内容をテスト
    match ClipboardContext::new() {
        Ok(ctx) => match ctx.get_text() {
            Ok(text) => println!(
                "📋 現在のクリップボード内容: {}",
                &text[..std::cmp::min(50, text.len())]
            ),
            Err(e) => println!("❌ クリップボード読み取りテストエラー: {}", e),
        },
        Err(e) => {
            return Err(format!("クリップボードコンテキスト作成エラー: {}", e));
        }
    }

    // ウォッチャーを作成
    let mut watcher: ClipboardWatcherContext<ClipboardManager> =
        match ClipboardWatcherContext::new() {
            Ok(watcher) => {
                println!("✅ ClipboardWatcherContext作成成功");
                watcher
            }
            Err(e) => {
                let error_msg = format!("ウォッチャー作成エラー: {}", e);
                println!("❌ {}", error_msg);
                return Err(error_msg);
            }
        };

    // db_stateをクローンしてスレッドに渡す
    let db_arc = Arc::clone(&db_state);

    // クリップボードマネージャーを作成
    let manager = ClipboardManager::new(app.clone(), Arc::clone(&db_arc));
    println!("✅ ClipboardManager作成成功");

    // ハンドラーを追加
    let shutdown_channel = watcher.add_handler(manager).get_shutdown_channel();
    println!("✅ ハンドラー追加成功");

    // shutdown_channelをグローバルに保存
    {
        let mut global_shutdown = SHUTDOWN_CHANNEL.lock().unwrap();
        *global_shutdown = Some(shutdown_channel);
    }

    MONITORING.store(true, Ordering::Relaxed);

    // clipboard-rsのstart_watch()は**ブロッキング**実行なので別スレッドで実行
    std::thread::spawn(move || {
        println!("🎯 clipboard-rs 監視開始中...");

        // start_watch()は内部でイベントループを実行し、shutdown_channel.stop()が呼ばれるまで継続
        watcher.start_watch();

        println!("🏁 clipboard-rs 監視終了");
        MONITORING.store(false, Ordering::Relaxed);
    });

    println!("✅ clipboard-rs 監視がバックグラウンドで開始されました");
    Ok(())
}

/// Rustバックエンドでクリップボード監視を停止
#[tauri::command]
pub async fn stop_clipboard_monitoring() -> Result<(), String> {
    println!("🛑 clipboard-rs監視停止要求");

    // 適切にshutdown_channelを使って停止
    {
        let mut global_shutdown = SHUTDOWN_CHANNEL.lock().unwrap();
        if let Some(shutdown_channel) = global_shutdown.take() {
            shutdown_channel.stop();
            println!("✅ clipboard-rs shutdown_channel.stop()実行");
        } else {
            println!("⚠️ shutdown_channelが見つかりません");
        }
    }

    MONITORING.store(false, Ordering::Relaxed);
    Ok(())
}

/// 監視状態を取得
#[tauri::command]
pub async fn get_monitoring_status() -> Result<bool, String> {
    let status = MONITORING.load(Ordering::Relaxed);
    println!("📊 現在の監視状態: {}", status);
    Ok(status)
}

/// clipboard-rsの動作テスト
#[tauri::command]
pub async fn test_clipboard_rs() -> Result<String, String> {
    println!("🧪 clipboard-rs動作テスト開始");

    // 1. ClipboardContext作成テスト
    let ctx = ClipboardContext::new().map_err(|e| format!("ClipboardContext作成失敗: {}", e))?;
    println!("✅ ClipboardContext作成成功");

    // 2. 現在のクリップボード内容を取得
    let current_text = ctx
        .get_text()
        .map_err(|e| format!("クリップボード読み取り失敗: {}", e))?;
    println!(
        "✅ クリップボード読み取り成功: {}",
        &current_text[..std::cmp::min(50, current_text.len())]
    );

    // 3. ClipboardWatcherContext作成テスト
    let _watcher: ClipboardWatcherContext<ClipboardManager> = ClipboardWatcherContext::new()
        .map_err(|e| format!("ClipboardWatcherContext作成失敗: {}", e))?;
    println!("✅ ClipboardWatcherContext作成成功");

    Ok(format!(
        "clipboard-rsテスト成功 - 現在のクリップボード: {}",
        current_text
    ))
}

/// クリップボードからテキストを取得
#[tauri::command]
pub async fn get_clipboard_text() -> Result<String, String> {
    let ctx = ClipboardContext::new().map_err(|e| format!("ClipboardContext作成エラー: {}", e))?;

    ctx.get_text()
        .map_err(|e| format!("クリップボード読み取りエラー: {}", e))
}

/// クリップボードにテキストを設定
#[tauri::command]
pub async fn set_clipboard_text(text: String) -> Result<(), String> {
    let ctx = ClipboardContext::new().map_err(|e| format!("ClipboardContext作成エラー: {}", e))?;

    ctx.set_text(text)
        .map_err(|e| format!("クリップボード書き込みエラー: {}", e))
}

/// クリップボードにテキストがあるかチェック
#[tauri::command]
pub async fn has_clipboard_text() -> Result<bool, String> {
    let ctx = ClipboardContext::new().map_err(|e| format!("ClipboardContext作成エラー: {}", e))?;

    match ctx.get_text() {
        Ok(text) => Ok(!text.is_empty()),
        Err(_) => Ok(false),
    }
}

/// クリップボードをクリア
#[tauri::command]
pub async fn clear_clipboard_text() -> Result<(), String> {
    let ctx = ClipboardContext::new().map_err(|e| format!("ClipboardContext作成エラー: {}", e))?;

    ctx.set_text("".to_string())
        .map_err(|e| format!("クリップボードクリアエラー: {}", e))
}

/// クリップボードで利用可能な形式を検出
fn detect_clipboard_formats(ctx: &ClipboardContext) -> Vec<String> {
    let mut formats = Vec::new();
    
    if ctx.has(ContentFormat::Text) {
        formats.push("text/plain".to_string());
    }
    if ctx.has(ContentFormat::Html) {
        formats.push("text/html".to_string());
    }
    if ctx.has(ContentFormat::Rtf) {
        formats.push("text/rtf".to_string());
    }
    if ctx.has(ContentFormat::Image) {
        formats.push("image/png".to_string());
    }
    if ctx.has(ContentFormat::Files) {
        formats.push("application/x-file-list".to_string());
    }
    
    formats
}

/// 優先順位に従ってクリップボードコンテンツを取得
fn get_clipboard_content_by_priority(ctx: &ClipboardContext) -> Result<(String, String), String> {
    // 優先順位: HTML > RTF > Files > Image > Text
    
    if ctx.has(ContentFormat::Html) {
        match ctx.get_html() {
            Ok(html) => return Ok((html, "text/html".to_string())),
            Err(e) => println!("HTML取得エラー: {}", e),
        }
    }
    
    if ctx.has(ContentFormat::Rtf) {
        match ctx.get_rich_text() {
            Ok(rtf) => return Ok((rtf, "text/rtf".to_string())),
            Err(e) => println!("RTF取得エラー: {}", e),
        }
    }
    
    if ctx.has(ContentFormat::Files) {
        match ctx.get_files() {
            Ok(files) => {
                let files_text = files.join("\n");
                return Ok((files_text, "application/x-file-list".to_string()));
            },
            Err(e) => println!("ファイルリスト取得エラー: {}", e),
        }
    }
    
    if ctx.has(ContentFormat::Image) {
        match ctx.get_image() {
            Ok(_image_data) => {
                // 画像データが検出されたことを示す
                let image_info = "[画像データ]".to_string();
                println!("📸 画像検出成功");
                return Ok((image_info, "image/png".to_string()));
            },
            Err(e) => println!("画像取得エラー: {}", e),
        }
    }
    
    // フォールバック: テキスト
    if ctx.has(ContentFormat::Text) {
        let text = ctx.get_text().map_err(|e| format!("テキスト取得エラー: {}", e))?;
        // テキストの内容を詳細分析してより正確な形式判定
        let format = analyze_text_format(&text);
        return Ok((text, format));
    }
    
    Err("利用可能なクリップボード形式がありません".to_string())
}

/// テキストの内容を分析してより正確な形式を判定
fn analyze_text_format(text: &str) -> String {
    if text.starts_with("http://") || text.starts_with("https://") {
        "text/uri-list".to_string()
    } else if text.starts_with("data:image/") {
        "image/png".to_string()
    } else if text.starts_with("data:") {
        "application/octet-stream".to_string()
    } else if text.contains("<html") || text.contains("</html>") {
        "text/html".to_string()
    } else if text.starts_with("{\\rtf") {
        "text/rtf".to_string()
    } else if text.starts_with("/") || text.starts_with("C:\\") || text.contains("\\") {
        "application/x-file-path".to_string()
    } else {
        "text/plain".to_string()
    }
}
