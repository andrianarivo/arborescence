use crate::state::{AppState, PtySession};
use base64::Engine;
use std::io::{Read, Write};
use std::os::fd::{AsRawFd, FromRawFd, OwnedFd};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Clone, serde::Serialize)]
struct PtyOutput {
    session_id: String,
    data: String,
}

fn openpty_and_spawn(
    worktree_path: &str,
    cols: u16,
    rows: u16,
) -> Result<(OwnedFd, u32), String> {
    let pty = nix::pty::openpty(None, None).map_err(|e| e.to_string())?;

    let size = libc::winsize {
        ws_row: rows,
        ws_col: cols,
        ws_xpixel: 0,
        ws_ypixel: 0,
    };
    unsafe {
        libc::ioctl(pty.master.as_raw_fd(), libc::TIOCSWINSZ, &size);
    }

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());

    match unsafe { libc::fork() } {
        -1 => Err("fork failed".to_string()),
        0 => {
            // child
            drop(pty.master);
            let slave_fd = pty.slave.as_raw_fd();

            unsafe {
                libc::setsid();
                libc::ioctl(slave_fd, libc::TIOCSCTTY as _, 0);
                libc::dup2(slave_fd, 0);
                libc::dup2(slave_fd, 1);
                libc::dup2(slave_fd, 2);
            }
            drop(pty.slave);

            let dir = std::ffi::CString::new(worktree_path).unwrap();
            unsafe { libc::chdir(dir.as_ptr()) };

            std::env::set_var("TERM", "xterm-256color");
            std::env::set_var("COLORTERM", "truecolor");
            std::env::set_var("LANG", "en_US.UTF-8");

            let shell_c = std::ffi::CString::new(shell.as_str()).unwrap();
            let basename = shell.rsplit('/').next().unwrap_or(&shell);
            let login_arg0 = std::ffi::CString::new(format!("-{}", basename)).unwrap();
            let args = [login_arg0.as_ptr(), std::ptr::null()];
            unsafe { libc::execvp(shell_c.as_ptr(), args.as_ptr()) };
            std::process::exit(1);
        }
        pid => {
            drop(pty.slave);
            Ok((pty.master, pid as u32))
        }
    }
}

#[tauri::command]
pub async fn create_pty(
    worktree_path: String,
    cols: u16,
    rows: u16,
    app: AppHandle,
) -> Result<String, String> {
    let session_id = uuid::Uuid::new_v4().to_string();

    let (master_fd, child_pid) = openpty_and_spawn(&worktree_path, cols, rows)?;

    let raw_fd = master_fd.as_raw_fd();
    let read_fd = unsafe { OwnedFd::from_raw_fd(libc::dup(raw_fd)) };
    let write_fd = unsafe { OwnedFd::from_raw_fd(libc::dup(raw_fd)) };
    let resize_fd = unsafe { OwnedFd::from_raw_fd(libc::dup(raw_fd)) };
    drop(master_fd);

    let mut reader: std::fs::File = read_fd.into();
    let sid = session_id.clone();
    let app_clone = app.clone();

    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let encoded =
                        base64::engine::general_purpose::STANDARD.encode(&buf[..n]);
                    let _ = app_clone.emit(
                        "pty-output",
                        PtyOutput {
                            session_id: sid.clone(),
                            data: encoded,
                        },
                    );
                }
                Err(_) => break,
            }
        }
    });

    let state: State<AppState> = app.state();
    state.pty_sessions.lock().insert(
        session_id.clone(),
        PtySession {
            resize_fd: resize_fd.into(),
            master_write: write_fd.into(),
            child_pid,
        },
    );

    Ok(session_id)
}

#[tauri::command]
pub async fn write_pty(
    session_id: String,
    data: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut sessions = state.pty_sessions.lock();
    let session = sessions
        .get_mut(&session_id)
        .ok_or("session not found")?;
    session
        .master_write
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn resize_pty(
    session_id: String,
    cols: u16,
    rows: u16,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let sessions = state.pty_sessions.lock();
    let session = sessions.get(&session_id).ok_or("session not found")?;
    let size = libc::winsize {
        ws_row: rows,
        ws_col: cols,
        ws_xpixel: 0,
        ws_ypixel: 0,
    };
    let ret =
        unsafe { libc::ioctl(session.resize_fd.as_raw_fd(), libc::TIOCSWINSZ, &size) };
    if ret == -1 {
        return Err("ioctl TIOCSWINSZ failed".to_string());
    }
    Ok(())
}

#[tauri::command]
pub async fn kill_pty(
    session_id: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut sessions = state.pty_sessions.lock();
    sessions.remove(&session_id);
    Ok(())
}
