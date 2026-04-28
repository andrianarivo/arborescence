use serde::Serialize;
use std::process::Command;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Worktree {
    pub name: String,
    pub branch: String,
    pub path: String,
    pub is_main: bool,
    pub last_activity: String,
}

#[tauri::command]
pub async fn validate_repo(path: String) -> Result<bool, String> {
    let output = Command::new("git")
        .args(["-C", &path, "rev-parse", "--git-dir"])
        .output()
        .map_err(|e| e.to_string())?;
    Ok(output.status.success())
}

#[tauri::command]
pub async fn list_worktrees(repo_path: String) -> Result<Vec<Worktree>, String> {
    let output = Command::new("git")
        .args(["-C", &repo_path, "worktree", "list", "--porcelain"])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut worktrees = Vec::new();
    let mut current_path = String::new();
    let mut current_branch = String::new();
    let mut is_bare = false;

    for line in stdout.lines() {
        if let Some(p) = line.strip_prefix("worktree ") {
            current_path = p.to_string();
            current_branch.clear();
            is_bare = false;
        } else if let Some(b) = line.strip_prefix("branch refs/heads/") {
            current_branch = b.to_string();
        } else if line == "bare" {
            is_bare = true;
        } else if line.is_empty() && !current_path.is_empty() && !is_bare {
            let name = std::path::Path::new(&current_path)
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let last_activity = get_last_commit_date(&current_path);
            let is_main = current_branch == "main" || current_branch == "master";

            worktrees.push(Worktree {
                name,
                branch: current_branch.clone(),
                path: current_path.clone(),
                is_main,
                last_activity,
            });
            current_path.clear();
        }
    }

    if !current_path.is_empty() && !is_bare {
        let name = std::path::Path::new(&current_path)
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let last_activity = get_last_commit_date(&current_path);
        let is_main = current_branch == "main" || current_branch == "master";

        worktrees.push(Worktree {
            name,
            branch: current_branch,
            path: current_path,
            is_main,
            last_activity,
        });
    }

    Ok(worktrees)
}

fn get_last_commit_date(worktree_path: &str) -> String {
    Command::new("git")
        .args(["-C", worktree_path, "log", "-1", "--format=%cI"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_default()
}

#[tauri::command]
pub async fn add_worktree(repo_path: String, branch: String) -> Result<Worktree, String> {
    let repo_name = std::path::Path::new(&repo_path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let worktree_name = format!("{}--{}", repo_name, branch);
    let worktree_path = std::path::Path::new(&repo_path)
        .parent()
        .ok_or("cannot resolve parent directory")?
        .join(&worktree_name);

    let output = Command::new("git")
        .args([
            "-C",
            &repo_path,
            "worktree",
            "add",
            worktree_path.to_str().unwrap(),
            "-b",
            &branch,
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }

    let path_str = worktree_path.to_string_lossy().to_string();
    Ok(Worktree {
        name: worktree_name,
        branch,
        path: path_str.clone(),
        is_main: false,
        last_activity: get_last_commit_date(&path_str),
    })
}

#[tauri::command]
pub async fn remove_worktree(repo_path: String, worktree_path: String) -> Result<(), String> {
    let output = Command::new("git")
        .args([
            "-C",
            &repo_path,
            "worktree",
            "remove",
            &worktree_path,
            "--force",
        ])
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn check_unpushed(worktree_path: String) -> Result<Vec<String>, String> {
    let output = Command::new("git")
        .args(["-C", &worktree_path, "log", "@{u}..", "--oneline"])
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let commits: Vec<String> = stdout
        .lines()
        .filter(|l| !l.is_empty())
        .map(|l| l.to_string())
        .collect();
    Ok(commits)
}
