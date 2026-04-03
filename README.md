# Arborescence

App native macOS pour gerer des git worktrees multi-projets avec terminal embarque.

Built with Tauri v2 (Rust) + React + TypeScript.

## Features

- Gestion multi-repos avec config persistante
- Liste et creation de worktrees
- Terminal embarque (xterm.js) avec sessions PTY persistantes
- Switch de worktree sans perdre la session terminal
- Warning commits non-pushes avant suppression

## Stack

| Layer | Tech |
|-------|------|
| Backend | Rust, Tauri v2, nix/libc (PTY) |
| Frontend | React 19, TypeScript, Zustand, xterm.js |
| Build | Vite, bun |

## Prerequis

- macOS
- [Rust](https://rustup.rs/)
- [bun](https://bun.sh/)
- Xcode Command Line Tools

## Demarrage

```bash
bun install
bun tauri dev
```

## Build

```bash
bun tauri build
```

L'app se trouve dans `src-tauri/target/release/bundle/macos/`.

## Architecture

```
src-tauri/src/
  commands/
    config.rs      # Lecture/ecriture config (~/.config/worktree-manager/config.json)
    git.rs         # Ops worktree (list, add, remove, check unpushed)
    terminal.rs    # Sessions PTY (create, write, resize, kill)
  state.rs         # AppState (sessions PTY en memoire)

src/
  store/appStore.ts          # Zustand store
  hooks/                     # useConfig, useWorktrees
  components/
    RepoList.tsx             # Sidebar repos
    WorktreeList.tsx         # Liste worktrees
    Terminal.tsx             # xterm.js avec pool de sessions
    AddRepoModal.tsx         # Modal ajout repo
    NewWorktreeModal.tsx     # Modal creation worktree
    ConfirmDialog.tsx        # Dialog confirmation
```
