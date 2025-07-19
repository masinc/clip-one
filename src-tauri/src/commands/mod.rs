// クリップボード操作コマンド
pub mod clipboard;
pub use clipboard::*;

// 履歴管理コマンド
pub mod history;
pub use history::*;

// 設定管理コマンド
pub mod settings;
pub use settings::*;

// エクスポート/インポートコマンド
pub mod export;
pub use export::*;

// テスト用コマンド
#[tauri::command]
pub fn test_command() -> String {
    println!("test_command が呼ばれました");
    "テストコマンド成功".to_string()
}

// テスト用データ追加
#[tauri::command]
pub async fn add_test_data(
    db_state: tauri::State<'_, std::sync::Arc<tokio::sync::Mutex<crate::database::Database>>>,
) -> Result<String, String> {
    println!("add_test_data コマンド呼び出し");

    let db = db_state.lock().await;

    // テストデータを追加
    let test_items = vec![
        ("テストテキスト1", "text/plain"),
        ("https://example.com", "text/uri-list"),
        (
            "const test = () => { console.log('hello'); };",
            "text/plain",
        ),
    ];

    let mut added_count = 0;
    for (content, content_type) in test_items {
        match db
            .save_clipboard_item(content, content_type, Some("TestApp"))
            .await
        {
            Ok(_) => {
                added_count += 1;
                println!("テストデータ追加成功: {}", content);
            }
            Err(e) => {
                println!("テストデータ追加失敗: {} - エラー: {}", content, e);
            }
        }
    }

    Ok(format!("{}件のテストデータを追加しました", added_count))
}
