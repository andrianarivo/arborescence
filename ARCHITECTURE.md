# Architecture — arborescence

Gestionnaire de worktrees Git, app desktop Tauri (React/TS + Rust).

## 1. Diagramme de packages (vue macro)

```mermaid
graph TB
    subgraph Frontend["Frontend (React 19 + TS, Vite)"]
        UI["components/<br/>(AppSidebar, RepoSidebarItem,<br/>Terminal, Modals…)"]
        UIKit["components/ui/<br/>(shadcn — radix wrappers)"]
        Hooks["hooks/<br/>(useConfig, useWorktrees,<br/>useWorktreeCache, useTheme)"]
        Store["store/appStore.ts<br/>(Zustand)"]
        Lib["lib/<br/>(keybindings, utils)"]
        Types["types.ts"]
    end

    subgraph Bridge["Tauri IPC"]
        Invoke["@tauri-apps/api<br/>invoke / event listen"]
    end

    subgraph Backend["Backend (Rust, Tauri 2)"]
        LibRs["lib.rs<br/>(invoke_handler)"]
        State["state.rs<br/>(AppState: PTY sessions)"]
        CmdGit["commands/git.rs"]
        CmdTerm["commands/terminal.rs"]
        CmdCfg["commands/config.rs"]
        CmdCache["commands/cache.rs"]
        CmdKeys["commands/keybindings.rs"]
    end

    subgraph External["Système"]
        GitCLI["git CLI"]
        PTY["PTY POSIX<br/>(libc, nix)"]
        FS["~/.config/<br/>worktree-manager/<br/>(config.json,<br/>worktree-cache.json)"]
    end

    UI --> UIKit
    UI --> Hooks
    UI --> Store
    UI --> Lib
    Hooks --> Store
    Hooks --> Invoke
    UI --> Invoke
    Invoke --> LibRs
    LibRs --> CmdGit
    LibRs --> CmdTerm
    LibRs --> CmdCfg
    LibRs --> CmdCache
    LibRs --> CmdKeys
    CmdTerm --> State
    CmdGit --> GitCLI
    CmdTerm --> PTY
    CmdCfg --> FS
    CmdCache --> FS
```

## 2. Hiérarchie des composants React

```mermaid
graph TD
    Main["main.tsx"] --> App["App.tsx"]
    App --> SidebarProvider["SidebarProvider (shadcn)"]
    SidebarProvider --> AppSidebar["AppSidebar"]
    SidebarProvider --> Main2["main (zone droite)"]
    Main2 -->|si worktree sélectionné| Terminal["Terminal<br/>(xterm.js + PTY)"]
    Main2 -->|sinon| EmptyState["EmptyState"]

    AppSidebar --> ResizeHandle["SidebarResizeHandle"]
    AppSidebar --> ThemeToggle["ThemeToggle"]
    AppSidebar --> AddRepoModal["AddRepoModal"]
    AppSidebar --> RepoItem["RepoSidebarItem (×N)"]

    RepoItem --> NewWorktreeModal["NewWorktreeModal"]
    RepoItem --> ConfirmDialog["ConfirmDialog"]
```

## 3. Flux IPC : commandes Tauri exposées

```mermaid
flowchart LR
    subgraph FE["Frontend (hooks)"]
        H1["useConfig"]
        H2["useWorktreeCache"]
        H3["useWorktrees"]
        H4["Terminal.tsx"]
        H5["lib/keybindings"]
    end

    subgraph BE["Backend (commands/*.rs)"]
        C1["read_config<br/>write_config"]
        C2["read_worktree_cache<br/>write_worktree_cache"]
        C3["validate_repo<br/>list_worktrees<br/>add_worktree<br/>remove_worktree<br/>check_unpushed"]
        C4["create_pty<br/>write_pty<br/>resize_pty<br/>kill_pty<br/>+ event 'pty-output'"]
        C5["read_keybindings"]
    end

    H1 --> C1
    H2 --> C2
    H2 --> C3
    H3 --> C3
    H4 --> C4
    H5 --> C5
```

## 4. State (Zustand) & persistance

```mermaid
graph LR
    subgraph Store["useAppStore (mémoire)"]
        repos["repos[]"]
        sel["selectedRepo /<br/>selectedWorktree"]
        wts["worktreesByRepo"]
        labels["worktreeLabels"]
        pty["ptySessions /<br/>activeTab"]
        ui["sidebarWidth /<br/>showHidden"]
    end

    subgraph Disk["Disque (config_dir/worktree-manager)"]
        cfg["config.json<br/>{repos, worktreeLabels,<br/>sidebarWidth}"]
        cache["worktree-cache.json"]
    end

    subgraph Live["Live"]
        Git["git worktree list<br/>(à chaque refresh)"]
        PTYproc["PTY sessions<br/>(AppState Rust)"]
    end

    cfg <-->|loadConfig / persist| repos
    cfg <-->|loadConfig / persist| labels
    cfg <-->|loadConfig / persist| ui
    cache <-->|bootstrap / persist| wts
    Git -->|list_worktrees| wts
    PTYproc <-->|registerPty /<br/>unregisterPty| pty
```

## 5. Séquence type — liste des worktrees (refresh d'un dépôt)

```mermaid
sequenceDiagram
    actor User
    participant UI as RepoSidebarItem
    participant Hook as useWorktreeCache
    participant Store as useAppStore
    participant IPC as Tauri invoke
    participant Rust as commands/git.rs
    participant Git as git CLI
    participant Disk as worktree-cache.json

    User->>UI: clic bouton "rafraîchir"
    UI->>Hook: refreshRepo(repoPath)
    Hook->>IPC: invoke('list_worktrees', {repoPath})
    IPC->>Rust: list_worktrees
    Rust->>Git: git -C <repo> worktree list --porcelain
    Git-->>Rust: stdout porcelain
    Rust->>Git: git -C <wt> log -1 --format=%cI<br/>(par worktree, pour lastActivity)
    Git-->>Rust: dates ISO
    Rust-->>IPC: Worktree[]
    IPC-->>Hook: Worktree[]
    Hook->>Store: setWorktreesForRepo(repoPath, wts)
    Note over Store: invalide selectedWorktree<br/>s'il a disparu
    Hook->>IPC: invoke('write_worktree_cache', {cache})
    IPC->>Rust: write_worktree_cache
    Rust->>Disk: écrit worktree-cache.json
```

## 6. Séquence type — suppression d'un worktree

```mermaid
sequenceDiagram
    actor User
    participant UI as RepoSidebarItem
    participant Confirm as ConfirmDialog
    participant Hook as useWorktrees
    participant Cfg as useConfig
    participant Cache as useWorktreeCache
    participant IPC as Tauri invoke
    participant Rust as commands/git.rs
    participant Git as git CLI
    participant Disk as config.json + cache.json

    User->>UI: clic "supprimer worktree"
    UI->>Hook: checkUnpushed(worktreePath)
    Hook->>IPC: invoke('check_unpushed', {worktreePath})
    IPC->>Rust: check_unpushed
    Rust->>Git: git -C <wt> log @{u}.. --oneline
    Git-->>Rust: commits non pushés
    Rust-->>Hook: string[]
    Hook-->>UI: liste commits
    UI->>Confirm: ouvre ConfirmDialog (warning si non vide)
    User->>Confirm: confirme
    Confirm->>Hook: deleteWorktree(worktreePath)
    Hook->>IPC: invoke('remove_worktree', {repoPath, worktreePath})
    IPC->>Rust: remove_worktree
    Rust->>Git: git -C <repo> worktree remove <wt> --force
    Git-->>Rust: ok
    Rust-->>Hook: ok
    Hook->>Cfg: removeWorktreeLabel(worktreePath)
    Cfg->>IPC: invoke('write_config', {config})
    IPC->>Disk: écrit config.json
    Hook->>Cache: refreshRepo(repoPath)
    Note over Cache: relance la séquence §5<br/>(list_worktrees + persist cache)
```

## 7. Séquence type — création d'un worktree

```mermaid
sequenceDiagram
    actor User
    participant UI as RepoSidebarItem
    participant Modal as NewWorktreeModal
    participant Hook as useWorktrees
    participant Cache as useWorktreeCache
    participant IPC as Tauri invoke
    participant Rust as commands/git.rs
    participant Git as git CLI

    User->>UI: clic "+ nouveau worktree"
    UI->>Modal: ouvre NewWorktreeModal
    User->>Modal: saisit branch
    Modal->>Hook: createWorktree(branch)
    Hook->>IPC: invoke('add_worktree', {repoPath, branch})
    IPC->>Rust: add_worktree
    Rust->>Git: git -C <repo> worktree add<br/>../<repo>--<branch> -b <branch>
    Git-->>Rust: ok
    Rust-->>Hook: Worktree
    Hook->>Cache: refreshRepo(repoPath)
    Note over Cache: relance la séquence §5
```

## En résumé

- **Stack** : Tauri 2 + React 19 + Zustand + xterm.js, UI shadcn (Radix + Tailwind v4).
- **Backend Rust** = 5 modules de commandes (`git`, `terminal`, `config`, `cache`, `keybindings`) + un `AppState` qui détient les sessions PTY.
- **Frontend** = 3 hooks pivots (`useConfig`, `useWorktreeCache`, `useWorktrees`) qui font le pont Zustand ↔ IPC, et un `Terminal` qui gère son propre cycle de vie xterm/PTY via events `pty-output`.
- **Persistance** = deux fichiers JSON dans `~/.config/worktree-manager/` (config + cache des worktrees pour bootstrap rapide).
