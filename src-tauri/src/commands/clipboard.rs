use crate::database::{Database, DisplayClipboardItem};
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use clipboard_rs::{
    common::RustImage, Clipboard, ClipboardContext, ClipboardHandler, ClipboardWatcher,
    ClipboardWatcherContext, ContentFormat,
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

        // 全ての利用可能な形式を収集
        let all_format_contents = collect_all_format_contents(&ctx);

        // 利用可能な形式のリストを作成
        let available_formats: Vec<String> = all_format_contents.keys().cloned().collect();

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
                    }
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

        // UTF-8文字境界を考慮した安全なスライス
        let preview = if current_content.len() <= 100 {
            current_content.as_str()
        } else {
            // 100バイト以下で有効な文字境界を見つける
            let mut boundary = 100;
            while boundary > 0 && !current_content.is_char_boundary(boundary) {
                boundary -= 1;
            }
            &current_content[..boundary]
        };

        println!("📝 新しい内容: {}", preview);
        self.last_content = current_content.clone();

        // 非同期でデータベース処理を実行
        let app_clone = self.app.clone();
        let db_clone = Arc::clone(&self.db);
        let content_clone = current_content.clone();
        let format_clone = detected_format.clone();
        let formats_clone = available_formats.clone();
        let contents_clone = all_format_contents.clone();

        // 新しいランタイムで非同期処理を実行
        std::thread::spawn(move || {
            let rt = tokio::runtime::Runtime::new().unwrap();
            rt.block_on(async move {
                let db = db_clone.lock().await;

                // 重複チェック - より厳密に
                let recent_items = match db.get_history(Some(5), None).await {
                    Ok(items) => items,
                    Err(e) => {
                        eprintln!("❌ 履歴取得エラー: {}", e);
                        return;
                    }
                };

                // 直近5件の中に同一内容があるかチェック（コピーボタン対策）
                let is_duplicate = recent_items.iter().any(|item| {
                    // プライマリコンテンツと同じかチェック
                    if let Some(primary_content) = item
                        .contents
                        .iter()
                        .find(|c| c.format == item.primary_format)
                    {
                        primary_content.content == content_clone
                    } else {
                        // プライマリが見つからない場合は任意のコンテンツと比較
                        item.contents
                            .iter()
                            .any(|content| content.content == content_clone)
                    }
                });

                // さらに、直前のアイテムと完全に同一の場合は確実にスキップ
                if let Some(latest_item) = recent_items.first() {
                    if let Some(latest_content) = latest_item
                        .contents
                        .iter()
                        .find(|c| c.format == latest_item.primary_format)
                    {
                        if latest_content.content == content_clone
                            && latest_item.primary_format == format_clone
                        {
                            // UTF-8文字境界を考慮した安全なスライス
                            let preview = if content_clone.len() <= 50 {
                                content_clone.as_str()
                            } else {
                                // 50バイト以下で有効な文字境界を見つける
                                let mut boundary = 50;
                                while boundary > 0 && !content_clone.is_char_boundary(boundary) {
                                    boundary -= 1;
                                }
                                &content_clone[..boundary]
                            };
                            println!(
                                "🔄 直前と同一の内容・フォーマットのため重複スキップ: {}",
                                preview
                            );
                            return;
                        }
                    }
                }

                if !is_duplicate {
                    match db
                        .save_clipboard_item_with_all_formats(
                            &content_clone,
                            &format_clone,
                            Some("clipboard-rs"),
                            &formats_clone,
                            &format_clone,
                            &contents_clone,
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
) -> Result<DisplayClipboardItem, String> {
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

    // 正規化されたデータベースでの重複チェック
    let is_duplicate = recent_items.iter().any(|item| {
        item.contents
            .iter()
            .any(|content_item| content_item.content == content)
    });
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
            Ok(text) => {
                // UTF-8文字境界を考慮した安全なスライス
                let preview = if text.len() <= 50 {
                    text.as_str()
                } else {
                    // 50バイト以下で有効な文字境界を見つける
                    let mut boundary = 50;
                    while boundary > 0 && !text.is_char_boundary(boundary) {
                        boundary -= 1;
                    }
                    &text[..boundary]
                };
                println!("📋 現在のクリップボード内容: {}", preview);
            }
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
    // UTF-8文字境界を考慮した安全なスライス
    let preview = if current_text.len() <= 50 {
        current_text.as_str()
    } else {
        // 50バイト以下で有効な文字境界を見つける
        let mut boundary = 50;
        while boundary > 0 && !current_text.is_char_boundary(boundary) {
            boundary -= 1;
        }
        &current_text[..boundary]
    };
    println!("✅ クリップボード読み取り成功: {}", preview);

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

/// 全ての利用可能な形式のコンテンツを収集
fn collect_all_format_contents(
    ctx: &ClipboardContext,
) -> std::collections::HashMap<String, String> {
    let mut contents = std::collections::HashMap::new();

    // テキスト形式
    if ctx.has(ContentFormat::Text) {
        if let Ok(text) = ctx.get_text() {
            let format = analyze_text_format(&text);
            contents.insert(format, text);
        }
    }

    // ファイルリスト形式
    if ctx.has(ContentFormat::Files) {
        if let Ok(files) = ctx.get_files() {
            let files_text = files.join("\n");
            contents.insert("application/x-file-list".to_string(), files_text);
        }
    }

    // 画像形式
    if ctx.has(ContentFormat::Image) {
        if let Ok(image_data) = ctx.get_image() {
            // RustImageDataの利用可能なメソッドを試してみる
            println!("📸 画像データ取得成功");

            // 画像をファイルに一時保存して読み込む方法を試す
            let temp_path = std::env::temp_dir().join("clipboard_debug.png");
            match image_data.save_to_path(&temp_path.to_string_lossy()) {
                Ok(_) => {
                    // ファイルからBase64を作成
                    match std::fs::read(&temp_path) {
                        Ok(bytes) => {
                            // 画像サイズ制限（5MB）
                            const MAX_IMAGE_SIZE: usize = 5 * 1024 * 1024;
                            if bytes.len() > MAX_IMAGE_SIZE {
                                println!(
                                    "📸 画像サイズが大きすぎます: {}バイト (上限: {}MB)",
                                    bytes.len(),
                                    MAX_IMAGE_SIZE / 1024 / 1024
                                );
                                let size_info = format!(
                                    "[画像データ: {}KB - サイズ制限により表示不可]",
                                    bytes.len() / 1024
                                );
                                contents.insert("image/png".to_string(), size_info);
                            } else {
                                let base64_data = BASE64.encode(&bytes);
                                let data_url = format!("data:image/png;base64,{}", base64_data);
                                contents.insert("image/png".to_string(), data_url);
                                println!("📸 画像データ保存成功: {}KB", bytes.len() / 1024);
                            }

                            // 一時ファイル削除
                            let _ = std::fs::remove_file(&temp_path);
                        }
                        Err(e) => {
                            println!("ファイル読み込みエラー: {}", e);
                            // Windows特有のエラーでもプレースホルダー保存
                            let error_info = format!("[画像データ: 読み込みエラー - {}]", e);
                            contents.insert("image/png".to_string(), error_info);
                        }
                    }
                }
                Err(e) => {
                    println!(
                        "画像保存エラー: {} (Windows OSError(0)は正常終了の場合があります)",
                        e
                    );
                    // Windows特有のOSError(0)の場合でもプレースホルダー保存
                    if e.to_string().contains("OSError(0)") {
                        let placeholder = "[画像データ: Windows取得エラー]".to_string();
                        contents.insert("image/png".to_string(), placeholder);
                    } else {
                        let error_info = format!("[画像データ: 保存エラー - {}]", e);
                        contents.insert("image/png".to_string(), error_info);
                    }
                }
            }
        }
    }

    // RTF形式
    if ctx.has(ContentFormat::Rtf) {
        if let Ok(rtf) = ctx.get_rich_text() {
            contents.insert("text/rtf".to_string(), rtf);
        }
    }

    // HTML形式
    if ctx.has(ContentFormat::Html) {
        if let Ok(html) = ctx.get_html() {
            contents.insert("text/html".to_string(), html);
        }
    }

    contents
}

/// 優先順位に従ってクリップボードコンテンツを取得
fn get_clipboard_content_by_priority(ctx: &ClipboardContext) -> Result<(String, String), String> {
    // 優先順位: Text > Files > Image > RTF > HTML
    // Textを最優先にすることで、URLなどが適切に判定される

    // 最優先: テキスト（URLやプレーンテキストを適切に処理）
    if ctx.has(ContentFormat::Text) {
        let text = ctx
            .get_text()
            .map_err(|e| format!("テキスト取得エラー: {}", e))?;
        // テキストの内容を詳細分析してより正確な形式判定
        let format = analyze_text_format(&text);
        return Ok((text, format));
    }

    if ctx.has(ContentFormat::Files) {
        match ctx.get_files() {
            Ok(files) => {
                let files_text = files.join("\n");
                return Ok((files_text, "application/x-file-list".to_string()));
            }
            Err(e) => println!("ファイルリスト取得エラー: {}", e),
        }
    }

    if ctx.has(ContentFormat::Image) {
        match ctx.get_image() {
            Ok(image_data) => {
                // RustImageDataの利用可能なメソッドを試してみる
                println!("📸 画像データ取得成功");

                // 画像をファイルに一時保存して読み込む方法を試す
                let temp_path = std::env::temp_dir().join("clipboard_priority_debug.png");
                match image_data.save_to_path(&temp_path.to_string_lossy()) {
                    Ok(_) => {
                        // ファイルからBase64を作成
                        match std::fs::read(&temp_path) {
                            Ok(bytes) => {
                                // 画像サイズ制限（5MB）
                                const MAX_IMAGE_SIZE: usize = 5 * 1024 * 1024;
                                if bytes.len() > MAX_IMAGE_SIZE {
                                    println!(
                                        "📸 画像サイズが大きすぎます: {}バイト (上限: {}MB)",
                                        bytes.len(),
                                        MAX_IMAGE_SIZE / 1024 / 1024
                                    );
                                    let size_info = format!(
                                        "[画像データ: {}KB - サイズ制限により表示不可]",
                                        bytes.len() / 1024
                                    );

                                    // 一時ファイル削除
                                    let _ = std::fs::remove_file(&temp_path);

                                    return Ok((size_info, "image/png".to_string()));
                                } else {
                                    let base64_data = BASE64.encode(&bytes);
                                    let data_url = format!("data:image/png;base64,{}", base64_data);
                                    println!("📸 画像データ変換成功: {}KB", bytes.len() / 1024);

                                    // 一時ファイル削除
                                    let _ = std::fs::remove_file(&temp_path);

                                    return Ok((data_url, "image/png".to_string()));
                                }
                            }
                            Err(e) => {
                                println!("ファイル読み込みエラー: {}", e);
                                return Ok((
                                    "[画像データ: 読み込みエラー]".to_string(),
                                    "image/png".to_string(),
                                ));
                            }
                        }
                    }
                    Err(e) => {
                        println!("画像保存エラー: {}", e);
                        return Ok((
                            "[画像データ: 保存エラー]".to_string(),
                            "image/png".to_string(),
                        ));
                    }
                }
            }
            Err(e) => {
                println!(
                    "画像取得エラー: {} (Windows OSError(0)は正常終了の場合があります)",
                    e
                );
                // Windows特有のOSError(0)の場合、画像が実際に存在する可能性があるため
                // プレースホルダーとして画像形式で保存
                if e.to_string().contains("OSError(0)") {
                    println!("📸 Windows OSError(0) - 画像データは存在する可能性があります");
                    println!("💡 clipboard-rsの制限: 将来的にarboardライブラリへの移行を検討");
                    return Ok((
                        "[画像データ: Windows取得エラー - arboard移行検討中]".to_string(),
                        "image/png".to_string(),
                    ));
                }
            }
        }
    }

    if ctx.has(ContentFormat::Rtf) {
        match ctx.get_rich_text() {
            Ok(rtf) => return Ok((rtf, "text/rtf".to_string())),
            Err(e) => println!("RTF取得エラー: {}", e),
        }
    }

    // 最低優先度: HTML（現在パース機能なし）
    if ctx.has(ContentFormat::Html) {
        match ctx.get_html() {
            Ok(html) => return Ok((html, "text/html".to_string())),
            Err(e) => println!("HTML取得エラー: {}", e),
        }
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
