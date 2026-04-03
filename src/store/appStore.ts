import { create } from 'zustand';
import type { Repo, Worktree } from '../types';

type AppStore = {
	repos: Repo[];
	selectedRepo: Repo | null;
	worktrees: Worktree[];
	selectedWorktree: Worktree | null;
	ptySessions: Record<string, string[]>;
	activeTab: Record<string, number>;
	setRepos: (repos: Repo[]) => void;
	selectRepo: (repo: Repo | null) => void;
	setWorktrees: (wts: Worktree[]) => void;
	selectWorktree: (wt: Worktree | null) => void;
	registerPty: (worktreePath: string, sessionId: string) => void;
	unregisterPty: (worktreePath: string, sessionId: string) => void;
	setActiveTab: (worktreePath: string, index: number) => void;
};

export const useAppStore = create<AppStore>((set) => ({
	repos: [],
	selectedRepo: null,
	worktrees: [],
	selectedWorktree: null,
	ptySessions: {},
	activeTab: {},
	setRepos: (repos) => set({ repos }),
	selectRepo: (repo) =>
		set({ selectedRepo: repo, worktrees: [], selectedWorktree: null }),
	setWorktrees: (worktrees) => set({ worktrees }),
	selectWorktree: (wt) => set({ selectedWorktree: wt }),
	registerPty: (worktreePath, sessionId) =>
		set((s) => {
			const list = [...(s.ptySessions[worktreePath] || []), sessionId];
			return {
				ptySessions: { ...s.ptySessions, [worktreePath]: list },
				activeTab: { ...s.activeTab, [worktreePath]: list.length - 1 },
			};
		}),
	unregisterPty: (worktreePath, sessionId) =>
		set((s) => {
			const list = (s.ptySessions[worktreePath] || []).filter(
				(id) => id !== sessionId,
			);
			const next = { ...s.ptySessions };
			const tabs = { ...s.activeTab };
			if (list.length === 0) {
				delete next[worktreePath];
				delete tabs[worktreePath];
			} else {
				next[worktreePath] = list;
				tabs[worktreePath] = Math.min(tabs[worktreePath] || 0, list.length - 1);
			}
			return { ptySessions: next, activeTab: tabs };
		}),
	setActiveTab: (worktreePath, index) =>
		set((s) => ({
			activeTab: { ...s.activeTab, [worktreePath]: index },
		})),
}));
