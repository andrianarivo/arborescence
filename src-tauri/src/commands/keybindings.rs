use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Keybinding {
    pub keys: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub action: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub send: Option<String>,
}

fn default_keybindings() -> Vec<Keybinding> {
    vec![
        Keybinding { keys: "cmd+left".into(), action: Some("beginning-of-line".into()), send: None },
        Keybinding { keys: "cmd+right".into(), action: Some("end-of-line".into()), send: None },
        Keybinding { keys: "cmd+backspace".into(), action: Some("kill-line".into()), send: None },
        Keybinding { keys: "alt+left".into(), action: Some("word-back".into()), send: None },
        Keybinding { keys: "alt+right".into(), action: Some("word-forward".into()), send: None },
        Keybinding { keys: "shift+enter".into(), action: Some("newline".into()), send: None },
    ]
}

fn keybindings_path() -> Result<std::path::PathBuf, String> {
    let dir = dirs::config_dir()
        .ok_or("cannot resolve config directory")?
        .join("worktree-manager");
    Ok(dir.join("keybindings.json"))
}

#[tauri::command]
pub async fn read_keybindings() -> Result<Vec<Keybinding>, String> {
    let path = keybindings_path()?;
    if !path.exists() {
        return Ok(default_keybindings());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}
