use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Repo {
    pub name: String,
    pub path: String,
    #[serde(default)]
    pub hidden: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct Config {
    #[serde(default)]
    pub repos: Vec<Repo>,
    #[serde(default, rename = "worktreeLabels")]
    pub worktree_labels: HashMap<String, String>,
    #[serde(default, rename = "sidebarWidth", skip_serializing_if = "Option::is_none")]
    pub sidebar_width: Option<u32>,
}

fn config_path() -> Result<PathBuf, String> {
    let dir = dirs::config_dir()
        .ok_or("cannot resolve config directory")?
        .join("worktree-manager");
    Ok(dir.join("config.json"))
}

#[tauri::command]
pub async fn read_config() -> Result<Config, String> {
    let path = config_path()?;
    if !path.exists() {
        return Ok(Config::default());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_config(config: Config) -> Result<(), String> {
    let path = config_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}
