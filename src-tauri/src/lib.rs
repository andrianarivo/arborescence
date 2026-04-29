mod commands;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::cache::read_worktree_cache,
            commands::cache::write_worktree_cache,
            commands::config::read_config,
            commands::config::write_config,
            commands::git::validate_repo,
            commands::git::list_worktrees,
            commands::git::add_worktree,
            commands::git::remove_worktree,
            commands::git::check_unpushed,
            commands::terminal::create_pty,
            commands::terminal::write_pty,
            commands::terminal::resize_pty,
            commands::terminal::kill_pty,
            commands::keybindings::read_keybindings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
