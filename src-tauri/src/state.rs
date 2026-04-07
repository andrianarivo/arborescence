use parking_lot::Mutex;
use std::collections::HashMap;
use std::fs::File;

pub struct PtySession {
    pub resize_fd: File,
    pub master_write: File,
    pub child_pid: u32,
}

impl Drop for PtySession {
    fn drop(&mut self) {
        unsafe {
            libc::kill(self.child_pid as i32, libc::SIGTERM);
        }
    }
}

#[derive(Default)]
pub struct AppState {
    pub pty_sessions: Mutex<HashMap<String, PtySession>>,
}
