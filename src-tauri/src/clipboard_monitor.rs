use std::sync::Arc;
use tokio::sync::Mutex;
use tokio::time::{sleep, Duration};
use tauri::{AppHandle, Manager, Emitter};
use crate::database::Database;

/// クリップボード監視サービス
pub struct ClipboardMonitor {
    is_monitoring: Arc<Mutex<bool>>,
    app_handle: AppHandle,
    database: Arc<Mutex<Database>>,
    last_content: Arc<Mutex<String>>,
}

impl ClipboardMonitor {
    pub fn new(app_handle: AppHandle, database: Arc<Mutex<Database>>) -> Self {
        Self {
            is_monitoring: Arc::new(Mutex::new(false)),
            app_handle,
            database,
            last_content: Arc::new(Mutex::new(String::new())),
        }
    }

    /// クリップボード監視を開始
    pub async fn start_monitoring(&self) -> Result<(), String> {
        let mut is_monitoring = self.is_monitoring.lock().await;
        
        if *is_monitoring {
            return Ok(()); // 既に監視中
        }

        *is_monitoring = true;
        drop(is_monitoring);

        let is_monitoring_clone = Arc::clone(&self.is_monitoring);
        let database_clone = Arc::clone(&self.database);
        let last_content_clone = Arc::clone(&self.last_content);
        let app_handle_clone = self.app_handle.clone();

        // バックグラウンドタスクでクリップボードを監視
        tokio::spawn(async move {
            println!("クリップボード監視を開始しました");

            while *is_monitoring_clone.lock().await {
                // クリップボード内容を取得（プレースホルダー実装）
                // 実際のtauri-plugin-clipboardのAPIに置き換える必要があります
                if let Ok(current_content) = Self::get_system_clipboard_content().await {
                    let mut last_content = last_content_clone.lock().await;
                    
                    // 内容が変更された場合のみ処理
                    if current_content != *last_content && !current_content.trim().is_empty() {
                        *last_content = current_content.clone();
                        drop(last_content);

                        // データベースに保存
                        let db = database_clone.lock().await;
                        if let Err(e) = db.save_clipboard_item(
                            &current_content,
                            "text", // 基本的にはテキストとして扱う
                            None, // ソースアプリは後で実装
                        ).await {
                            eprintln!("クリップボードアイテム保存エラー: {}", e);
                        } else {
                            // フロントエンドにイベントを送信
                            if let Err(e) = app_handle_clone.emit("clipboard-updated", &current_content) {
                                eprintln!("クリップボードイベント送信エラー: {}", e);
                            }
                        }
                        drop(db);
                    }
                }

                // 500msごとにチェック
                sleep(Duration::from_millis(500)).await;
            }

            println!("クリップボード監視を停止しました");
        });

        Ok(())
    }

    /// クリップボード監視を停止
    pub async fn stop_monitoring(&self) -> Result<(), String> {
        let mut is_monitoring = self.is_monitoring.lock().await;
        *is_monitoring = false;
        Ok(())
    }

    /// 監視状態を取得
    pub async fn is_monitoring(&self) -> bool {
        *self.is_monitoring.lock().await
    }

    /// システムクリップボード内容を取得（プレースホルダー実装）
    async fn get_system_clipboard_content() -> Result<String, String> {
        // TODO: tauri-plugin-clipboardの実際のAPIを使用
        // 現在はプレースホルダー実装
        
        // Linux/Unix系での実装例（xclipを使用）
        #[cfg(target_os = "linux")]
        {
            use std::process::Command;
            
            match Command::new("xclip")
                .args(["-o", "-selection", "clipboard"])
                .output()
            {
                Ok(output) => {
                    if output.status.success() {
                        String::from_utf8(output.stdout)
                            .map_err(|e| format!("UTF-8変換エラー: {}", e))
                    } else {
                        Err("xclipコマンドが失敗しました".to_string())
                    }
                }
                Err(e) => Err(format!("xclipコマンド実行エラー: {}", e)),
            }
        }

        // Windows実装（プレースホルダー）
        #[cfg(target_os = "windows")]
        {
            // TODO: Windows クリップボードAPI実装
            Err("Windows クリップボードアクセスは未実装です".to_string())
        }

        // macOS実装（プレースホルダー）
        #[cfg(target_os = "macos")]
        {
            use std::process::Command;
            
            match Command::new("pbpaste").output() {
                Ok(output) => {
                    if output.status.success() {
                        String::from_utf8(output.stdout)
                            .map_err(|e| format!("UTF-8変換エラー: {}", e))
                    } else {
                        Err("pbpasteコマンドが失敗しました".to_string())
                    }
                }
                Err(e) => Err(format!("pbpasteコマンド実行エラー: {}", e)),
            }
        }

        // その他のプラットフォーム
        #[cfg(not(any(target_os = "linux", target_os = "windows", target_os = "macos")))]
        {
            Err("このプラットフォームはサポートされていません".to_string())
        }
    }

    /// コンテンツタイプを自動判定
    fn detect_content_type(content: &str) -> String {
        if content.starts_with("http://") || content.starts_with("https://") {
            "url".to_string()
        } else if content.starts_with("data:image/") {
            "image".to_string()
        } else if content.contains("<html") || content.contains("</html>") {
            "html".to_string()
        } else if content.lines().count() > 1 && content.len() > 200 {
            "text/multiline".to_string()
        } else {
            "text".to_string()
        }
    }
}

/// クリップボード監視を開始するためのTauriコマンド
#[tauri::command]
pub async fn start_clipboard_monitoring_service(
    app_handle: AppHandle,
) -> Result<(), String> {
    // アプリケーションの状態からクリップボードモニターを取得または作成
    let database = app_handle.state::<Arc<Mutex<Database>>>().inner().clone();
    
    let monitor = ClipboardMonitor::new(app_handle, database);
    monitor.start_monitoring().await
}

/// クリップボード監視を停止するためのTauriコマンド
#[tauri::command]
pub async fn stop_clipboard_monitoring_service(
    _app_handle: AppHandle,
) -> Result<(), String> {
    // 実際の実装では、アプリケーション状態からモニターインスタンスを取得
    // 現在はプレースホルダー実装
    println!("クリップボード監視サービスを停止します");
    Ok(())
}

/// クリップボード監視状態を取得
#[tauri::command]
pub async fn get_clipboard_monitoring_status() -> Result<bool, String> {
    // TODO: 実際の監視状態を返す
    Ok(false)
}