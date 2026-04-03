import { create } from 'zustand';
import type { Repo, Worktree } from '../types';

type AppStore = {
	repos: Repo[];
	selectedRepo: Repo | null;
	worktrees: Worktree[];
	selectedWorktree: Worktree | null;
	ptySessions: Record<string, string>;
	setRepos: (repos: Repo[]) => void;
	selectRepo: (repo: Repo | null) => void;
	setWorktrees: (wts: Worktree[]) => void;
	selectWorktree: (wt: Worktree | null) => void;
	registerPty: (worktreePath: string, sessionId: string) => void;
	unregisterPty: (worktreePath: string) => void;
};

export const useAppStore = create<AppStore>((set) => ({
	repos: [],
	selectedRepo: null,
	worktrees: [],
	selectedWorktree: null,
	ptySessions: {},
	setRepos: (repos) => set({ repos }),
	selectRepo: (repo) =>
		set({ selectedRepo: repo, worktrees: [], selectedWorktree: null }),
	setWorktrees: (worktrees) => set({ worktrees }),
	selectWorktree: (wt) => set({ selectedWorktree: wt }),
	registerPty: (worktreePath, sessionId) =>
		set((s) => ({
			ptySessions: { ...s.ptySessions, [worktreePath]: sessionId },
		})),
	unregisterPty: (worktreePath) =>
		set((s) => {
			const next = { ...s.ptySessions };
			delete next[worktreePath];
			return { ptySessions: next };
		}),
}));
