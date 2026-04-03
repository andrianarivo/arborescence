import { create } from 'zustand';
import type { Repo, Worktree } from '../types';

type AppStore = {
	repos: Repo[];
	selectedRepo: Repo | null;
	worktrees: Worktree[];
	selectedWorktree: Worktree | null;
	activePtySession: string | null;
	setRepos: (repos: Repo[]) => void;
	selectRepo: (repo: Repo | null) => void;
	setWorktrees: (wts: Worktree[]) => void;
	selectWorktree: (wt: Worktree | null) => void;
	setActivePty: (sessionId: string | null) => void;
};

export const useAppStore = create<AppStore>((set) => ({
	repos: [],
	selectedRepo: null,
	worktrees: [],
	selectedWorktree: null,
	activePtySession: null,
	setRepos: (repos) => set({ repos }),
	selectRepo: (repo) =>
		set({ selectedRepo: repo, worktrees: [], selectedWorktree: null }),
	setWorktrees: (worktrees) => set({ worktrees }),
	selectWorktree: (wt) => set({ selectedWorktree: wt }),
	setActivePty: (sessionId) => set({ activePtySession: sessionId }),
}));
