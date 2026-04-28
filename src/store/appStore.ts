import { create } from 'zustand';
import type { Repo, Worktree } from '../types';

type AppStore = {
	repos: Repo[];
	selectedRepo: Repo | null;
	worktrees: Worktree[];
	selectedWorktree: Worktree | null;
	worktreeByRepo: Record<string, string>;
	terminalHeight: number;
	ptySessions: Record<string, string[]>;
	activeTab: Record<string, number>;
	showHidden: boolean;
	worktreeLabels: Record<string, string>;
	setRepos: (repos: Repo[]) => void;
	setWorktreeLabels: (labels: Record<string, string>) => void;
	toggleShowHidden: () => void;
	selectRepo: (repo: Repo | null) => void;
	setWorktrees: (wts: Worktree[]) => void;
	selectWorktree: (wt: Worktree | null) => void;
	setTerminalHeight: (h: number) => void;
	registerPty: (worktreePath: string, sessionId: string) => void;
	unregisterPty: (worktreePath: string, sessionId: string) => void;
	setActiveTab: (worktreePath: string, index: number) => void;
};

export const useAppStore = create<AppStore>((set) => ({
	repos: [],
	selectedRepo: null,
	worktrees: [],
	selectedWorktree: null,
	worktreeByRepo: {},
	terminalHeight: 300,
	ptySessions: {},
	activeTab: {},
	showHidden: false,
	worktreeLabels: {},
	setRepos: (repos) => set({ repos }),
	setWorktreeLabels: (worktreeLabels) => set({ worktreeLabels }),
	toggleShowHidden: () => set((s) => ({ showHidden: !s.showHidden })),
	selectRepo: (repo) =>
		set({ selectedRepo: repo, worktrees: [], selectedWorktree: null }),
	setWorktrees: (worktrees) =>
		set((s) => {
			const repoPath = s.selectedRepo?.path;
			const remembered = repoPath ? s.worktreeByRepo[repoPath] : undefined;
			const match = remembered
				? worktrees.find((wt) => wt.path === remembered)
				: undefined;
			return { worktrees, selectedWorktree: match ?? null };
		}),
	selectWorktree: (wt) =>
		set((s) => {
			const repoPath = s.selectedRepo?.path;
			if (!repoPath) return { selectedWorktree: wt };
			if (wt) {
				return {
					selectedWorktree: wt,
					worktreeByRepo: { ...s.worktreeByRepo, [repoPath]: wt.path },
				};
			}
			const next = { ...s.worktreeByRepo };
			delete next[repoPath];
			return { selectedWorktree: null, worktreeByRepo: next };
		}),
	setTerminalHeight: (h) => set({ terminalHeight: h }),
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
