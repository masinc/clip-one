use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// グローバルアクションの構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalAction {
    pub id: String,
    pub label: String,
    pub command: Option<String>,
    pub description: Option<String>,
    pub icon: String,
    pub enabled: bool,
    pub priority: i32,
    pub keywords: Vec<String>,
    pub is_custom: bool,
    pub action_type: String, // "url", "command", "code", "built-in"
    pub allowed_content_types: Vec<String>, // "text", "url", "html", "image", "files"
}

/// アプリケーション情報の構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,               // アプリ名
    pub version: String,            // バージョン（Cargo.tomlから）
    pub description: String,        // アプリ説明
    pub author: String,             // 作者
    pub license: Option<String>,    // ライセンス
    pub repository: Option<String>, // リポジトリURL
    pub homepage: Option<String>,   // ホームページ
    pub build_date: String,         // ビルド日時
}

/// アプリケーション設定の構造体（簡素化）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub max_history_items: u32,
    pub hotkeys: HashMap<String, String>,
    pub theme: String,
    pub export_format: String,
    pub notifications_enabled: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        let mut hotkeys = HashMap::new();
        hotkeys.insert("toggle_window".to_string(), "Ctrl+Shift+V".to_string());
        hotkeys.insert("clear_clipboard".to_string(), "Ctrl+Shift+C".to_string());

        Self {
            max_history_items: 1000,
            hotkeys,
            theme: "dark".to_string(),
            export_format: "json".to_string(),
            notifications_enabled: true,
        }
    }
}

impl AppSettings {
    /// 設定ファイルのパスを取得
    fn get_settings_path() -> Result<PathBuf> {
        // データベースと同じディレクトリを使用
        let current_dir = std::env::current_dir()?;
        let app_dir = current_dir.join("data");
        Ok(app_dir.join("settings.json"))
    }

    /// 設定ファイルから読み込み（マイグレーション対応）
    pub async fn load() -> Result<Self> {
        let settings_path = Self::get_settings_path()?;

        if !settings_path.exists() {
            // 設定ファイルが存在しない場合はデフォルト設定を保存
            let default_settings = Self::default();
            default_settings.save().await?;
            return Ok(default_settings);
        }

        let content = tokio::fs::read_to_string(&settings_path).await?;
        
        // 新しい形式で読み込み試行
        if let Ok(settings) = serde_json::from_str::<Self>(&content) {
            return Ok(settings);
        }

        // 旧形式からマイグレーション
        if let Ok(legacy_value) = serde_json::from_str::<serde_json::Value>(&content) {
            let migrated_settings = Self::migrate_from_legacy(legacy_value)?;
            // マイグレーション後の設定を保存
            migrated_settings.save().await?;
            return Ok(migrated_settings);
        }

        // フォールバック：デフォルト設定
        let default_settings = Self::default();
        default_settings.save().await?;
        Ok(default_settings)
    }

    /// 旧形式の設定からマイグレーション
    fn migrate_from_legacy(legacy: serde_json::Value) -> Result<Self> {
        let mut settings = Self::default();

        // 最大履歴項目数
        if let Some(max_history) = legacy.get("max_history_items").and_then(|v| v.as_u64()) {
            settings.max_history_items = max_history as u32;
        }

        // テーマ
        if let Some(theme) = legacy.get("theme").and_then(|v| v.as_str()) {
            settings.theme = theme.to_string();
        }

        // エクスポート形式
        if let Some(export_format) = legacy.get("export_format").and_then(|v| v.as_str()) {
            settings.export_format = export_format.to_string();
        }

        // 通知設定（旧形式のnotifications.enabledまたはnotifications_enabled）
        if let Some(enabled) = legacy.get("notifications")
            .and_then(|n| n.get("enabled"))
            .and_then(|v| v.as_bool()) {
            settings.notifications_enabled = enabled;
        } else if let Some(enabled) = legacy.get("notifications_enabled").and_then(|v| v.as_bool()) {
            settings.notifications_enabled = enabled;
        }

        // ホットキー（存在すれば保持）
        if let Some(hotkeys_obj) = legacy.get("hotkeys").and_then(|v| v.as_object()) {
            let mut hotkeys = HashMap::new();
            for (key, value) in hotkeys_obj {
                if let Some(value_str) = value.as_str() {
                    hotkeys.insert(key.clone(), value_str.to_string());
                }
            }
            if !hotkeys.is_empty() {
                settings.hotkeys = hotkeys;
            }
        }

        Ok(settings)
    }

    /// 設定ファイルに保存
    pub async fn save(&self) -> Result<()> {
        let settings_path = Self::get_settings_path()?;

        // ディレクトリを作成
        if let Some(parent) = settings_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let content = serde_json::to_string_pretty(self)?;
        tokio::fs::write(&settings_path, content).await?;

        Ok(())
    }
}

impl GlobalAction {
    /// アクション設定ファイルのパスを取得
    fn get_actions_path() -> Result<PathBuf> {
        let current_dir = std::env::current_dir()?;
        let app_dir = current_dir.join("data");
        Ok(app_dir.join("actions.json"))
    }

    /// デフォルトアクションを取得（フロントエンドと同じ内容）
    fn get_default_actions() -> Vec<Self> {
        vec![
            // 基本アクション
            Self {
                id: "copy".to_string(),
                label: "クリップボードにコピー".to_string(),
                command: None,
                description: None,
                icon: "Copy".to_string(),
                enabled: true,
                priority: 1,
                keywords: vec!["copy".to_string(), "コピー".to_string(), "clipboard".to_string()],
                is_custom: false,
                action_type: "built-in".to_string(),
                allowed_content_types: vec!["text".to_string(), "url".to_string(), "html".to_string(), "image".to_string(), "files".to_string()],
            },
            Self {
                id: "search".to_string(),
                label: "Web検索".to_string(),
                command: Some("https://www.google.com/search?q=CONTENT".to_string()),
                description: None,
                icon: "Search".to_string(),
                enabled: true,
                priority: 2,
                keywords: vec!["search".to_string(), "検索".to_string(), "google".to_string(), "web".to_string()],
                is_custom: true,
                action_type: "url".to_string(),
                allowed_content_types: vec!["text".to_string(), "url".to_string()],
            },
            Self {
                id: "translate".to_string(),
                label: "翻訳".to_string(),
                command: Some("https://translate.google.com/?text=CONTENT".to_string()),
                description: None,
                icon: "Languages".to_string(),
                enabled: true,
                priority: 3,
                keywords: vec!["translate".to_string(), "翻訳".to_string(), "language".to_string(), "言語".to_string()],
                is_custom: true,
                action_type: "url".to_string(),
                allowed_content_types: vec!["text".to_string()],
            },
            // AI関連
            Self {
                id: "chatgpt".to_string(),
                label: "ChatGPTに送信".to_string(),
                command: Some("https://chat.openai.com/?q=CONTENT".to_string()),
                description: None,
                icon: "Bot".to_string(),
                enabled: true,
                priority: 4,
                keywords: vec!["chatgpt".to_string(), "ai".to_string(), "gpt".to_string(), "openai".to_string(), "人工知能".to_string()],
                is_custom: true,
                action_type: "url".to_string(),
                allowed_content_types: vec!["text".to_string()],
            },
            Self {
                id: "claude".to_string(),
                label: "Claudeに送信".to_string(),
                command: Some("https://claude.ai/?q=CONTENT".to_string()),
                description: None,
                icon: "Brain".to_string(),
                enabled: true,
                priority: 5,
                keywords: vec!["claude".to_string(), "ai".to_string(), "anthropic".to_string(), "人工知能".to_string()],
                is_custom: true,
                action_type: "url".to_string(),
                allowed_content_types: vec!["text".to_string()],
            },
            Self {
                id: "summarize".to_string(),
                label: "AI要約".to_string(),
                command: None,
                description: Some("AIによるテキスト要約（未実装）".to_string()),
                icon: "Sparkles".to_string(),
                enabled: false,
                priority: 6,
                keywords: vec!["summarize".to_string(), "要約".to_string(), "summary".to_string(), "ai".to_string()],
                is_custom: true,
                action_type: "built-in".to_string(),
                allowed_content_types: vec!["text".to_string()],
            },
            // Web・URL関連
            Self {
                id: "open-url".to_string(),
                label: "URLを開く".to_string(),
                command: None,
                description: None,
                icon: "ExternalLink".to_string(),
                enabled: true,
                priority: 2,
                keywords: vec!["url".to_string(), "open".to_string(), "開く".to_string(), "link".to_string(), "リンク".to_string()],
                is_custom: true,
                action_type: "built-in".to_string(),
                allowed_content_types: vec!["url".to_string()],
            },
        ]
    }

    /// アクション設定を読み込み
    pub async fn load_actions() -> Result<Vec<Self>> {
        let actions_path = Self::get_actions_path()?;

        if !actions_path.exists() {
            // ファイルが存在しない場合はデフォルトアクションを保存
            let default_actions = Self::get_default_actions();
            Self::save_actions(&default_actions).await?;
            return Ok(default_actions);
        }

        let content = tokio::fs::read_to_string(&actions_path).await?;
        let actions: Vec<Self> = serde_json::from_str(&content)?;
        Ok(actions)
    }

    /// アクション設定を保存
    pub async fn save_actions(actions: &[Self]) -> Result<()> {
        let actions_path = Self::get_actions_path()?;

        // ディレクトリを作成
        if let Some(parent) = actions_path.parent() {
            tokio::fs::create_dir_all(parent).await?;
        }

        let content = serde_json::to_string_pretty(actions)?;
        tokio::fs::write(&actions_path, content).await?;

        Ok(())
    }
}

/// アプリケーション設定を取得
#[tauri::command]
pub async fn get_app_settings() -> Result<AppSettings, String> {
    AppSettings::load()
        .await
        .map_err(|e| format!("設定読み込みエラー: {}", e))
}

/// アプリケーション設定を保存
#[tauri::command]
pub async fn save_app_settings(settings: AppSettings) -> Result<(), String> {
    settings
        .save()
        .await
        .map_err(|e| format!("設定保存エラー: {}", e))
}

/// 設定を特定のキーで更新
#[tauri::command]
pub async fn update_setting(key: String, value: serde_json::Value) -> Result<(), String> {
    let mut settings = AppSettings::load()
        .await
        .map_err(|e| format!("設定読み込みエラー: {}", e))?;

    match key.as_str() {
        "max_history_items" => {
            settings.max_history_items = value
                .as_u64()
                .ok_or_else(|| "max_history_itemsは数値である必要があります".to_string())?
                as u32;
        }
        "theme" => {
            settings.theme = value
                .as_str()
                .ok_or_else(|| "themeは文字列である必要があります".to_string())?
                .to_string();
        }
        "notifications_enabled" => {
            settings.notifications_enabled = value.as_bool().ok_or_else(|| {
                "notifications_enabledはboolean値である必要があります".to_string()
            })?;
        }
        "export_format" => {
            settings.export_format = value
                .as_str()
                .ok_or_else(|| "export_formatは文字列である必要があります".to_string())?
                .to_string();
        }
        _ => return Err(format!("未知の設定キー: {}", key)),
    }

    settings
        .save()
        .await
        .map_err(|e| format!("設定保存エラー: {}", e))
}

/// 設定をデフォルトにリセット
#[tauri::command]
pub async fn reset_settings() -> Result<AppSettings, String> {
    let default_settings = AppSettings::default();
    default_settings
        .save()
        .await
        .map_err(|e| format!("設定リセットエラー: {}", e))?;

    Ok(default_settings)
}

/// アプリケーション情報を取得
#[tauri::command]
pub async fn get_app_info() -> Result<AppInfo, String> {
    // Cargo.tomlから情報を取得
    let name = env!("CARGO_PKG_NAME").to_string();
    let version = env!("CARGO_PKG_VERSION").to_string();
    let description = env!("CARGO_PKG_DESCRIPTION").to_string();
    let authors = env!("CARGO_PKG_AUTHORS").to_string();

    // ライセンス情報（Cargo.tomlから取得、なければNone）
    let license = option_env!("CARGO_PKG_LICENSE").map(|s| s.to_string());

    // リポジトリ情報（Cargo.tomlから取得、なければNone）
    let repository = option_env!("CARGO_PKG_REPOSITORY").map(|s| s.to_string());

    // ホームページ情報（Cargo.tomlから取得、なければNone）
    let homepage = option_env!("CARGO_PKG_HOMEPAGE").map(|s| s.to_string());

    // ビルド日時（コンパイル時の日付を生成）
    let build_date = chrono::Utc::now().format("%Y.%m.%d").to_string();

    Ok(AppInfo {
        name,
        version,
        description,
        author: authors,
        license,
        repository,
        homepage,
        build_date,
    })
}

/// アクション設定を取得
#[tauri::command]
pub async fn get_actions() -> Result<Vec<GlobalAction>, String> {
    GlobalAction::load_actions()
        .await
        .map_err(|e| format!("アクション読み込みエラー: {}", e))
}

/// アクション設定を保存
#[tauri::command]
pub async fn save_actions(actions: Vec<GlobalAction>) -> Result<(), String> {
    GlobalAction::save_actions(&actions)
        .await
        .map_err(|e| format!("アクション保存エラー: {}", e))
}

/// アクション設定をデフォルトにリセット
#[tauri::command]
pub async fn reset_actions() -> Result<Vec<GlobalAction>, String> {
    let default_actions = GlobalAction::get_default_actions();
    GlobalAction::save_actions(&default_actions)
        .await
        .map_err(|e| format!("アクションリセットエラー: {}", e))?;

    Ok(default_actions)
}
