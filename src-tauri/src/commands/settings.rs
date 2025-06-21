use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use anyhow::Result;

/// アプリケーション設定の構造体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub version: String,
    pub auto_start: bool,
    pub max_history_items: u32,
    pub hotkeys: HashMap<String, String>,
    pub theme: String,
    pub window: WindowSettings,
    pub notifications: NotificationSettings,
    pub database: DatabaseSettings,
    pub export_format: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowSettings {
    pub width: u32,
    pub height: u32,
    pub remember_position: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub enabled: bool,
    pub show_on_copy: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseSettings {
    pub auto_cleanup: bool,
    pub cleanup_days: u32,
}

impl Default for AppSettings {
    fn default() -> Self {
        let mut hotkeys = HashMap::new();
        hotkeys.insert("toggle_window".to_string(), "Ctrl+Shift+V".to_string());
        hotkeys.insert("clear_clipboard".to_string(), "Ctrl+Shift+C".to_string());

        Self {
            version: "1.0.0".to_string(),
            auto_start: true,
            max_history_items: 1000,
            hotkeys,
            theme: "dark".to_string(),
            window: WindowSettings {
                width: 800,
                height: 600,
                remember_position: true,
            },
            notifications: NotificationSettings {
                enabled: true,
                show_on_copy: false,
            },
            database: DatabaseSettings {
                auto_cleanup: true,
                cleanup_days: 30,
            },
            export_format: "json".to_string(),
        }
    }
}

impl AppSettings {
    /// 設定ファイルのパスを取得
    fn get_settings_path() -> Result<PathBuf> {
        // データベースと同じディレクトリを使用
        let exe_dir = std::env::current_exe()?
            .parent()
            .ok_or_else(|| anyhow::anyhow!("実行ファイルの親ディレクトリが取得できません"))?
            .to_path_buf();
        
        let app_dir = exe_dir.join("data");
        Ok(app_dir.join("settings.json"))
    }

    /// 設定ファイルから読み込み
    pub async fn load() -> Result<Self> {
        let settings_path = Self::get_settings_path()?;
        
        if !settings_path.exists() {
            // 設定ファイルが存在しない場合はデフォルト設定を保存
            let default_settings = Self::default();
            default_settings.save().await?;
            return Ok(default_settings);
        }

        let content = tokio::fs::read_to_string(&settings_path).await?;
        let settings: Self = serde_json::from_str(&content)?;
        
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
        "auto_start" => {
            settings.auto_start = value.as_bool()
                .ok_or_else(|| "auto_startはboolean値である必要があります".to_string())?;
        },
        "max_history_items" => {
            settings.max_history_items = value.as_u64()
                .ok_or_else(|| "max_history_itemsは数値である必要があります".to_string())? as u32;
        },
        "theme" => {
            settings.theme = value.as_str()
                .ok_or_else(|| "themeは文字列である必要があります".to_string())?
                .to_string();
        },
        "notifications.enabled" => {
            settings.notifications.enabled = value.as_bool()
                .ok_or_else(|| "notifications.enabledはboolean値である必要があります".to_string())?;
        },
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