use crate::commands::git::Worktree;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

pub type WorktreeCache = HashMap<String, Vec<Worktree>>;

fn cache_path() -> Result<PathBuf, String> {
    let dir = dirs::config_dir()
        .ok_or("cannot resolve config directory")?
        .join("worktree-manager");
    Ok(dir.join("worktree-cache.json"))
}

#[tauri::command]
pub async fn read_worktree_cache() -> Result<WorktreeCache, String> {
    let path = cache_path()?;
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_worktree_cache(cache: WorktreeCache) -> Result<(), String> {
    let path = cache_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let data = serde_json::to_string_pretty(&cache).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}
