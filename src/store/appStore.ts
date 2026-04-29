import { create } from 'zustand';
import type { Repo, Worktree } from '../types';

type AppStore = {
	repos: Repo[];
	selectedRepo: Repo | null;
	worktreesByRepo: Record<string, Worktree[]>;
	selectedWorktree: Worktree | null;
	worktreeByRepo: Record<string, string>;
	ptySessions: Record<string, string[]>;
	activeTab: Record<string, number>;
	showHidden: boolean;
	worktreeLabels: Record<string, string>;
	setRepos: (repos: Repo[]) => void;
	setWorktreeLabels: (labels: Record<string, string>) => void;
	toggleShowHidden: () => void;
	selectRepo: (repo: Repo | null) => void;
	setWorktreesByRepo: (cache: Record<string, Worktree[]>) => void;
	setWorktreesForRepo: (repoPath: string, worktrees: Worktree[]) => void;
	removeWorktreesForRepo: (repoPath: string) => void;
	selectWorktree: (wt: Worktree | null) => void;
	registerPty: (worktreePath: string, sessionId: string) => void;
	unregisterPty: (worktreePath: string, sessionId: string) => void;
	setActiveTab: (worktreePath: string, index: number) => void;
};

export const useAppStore = create<AppStore>((set) => ({
	repos: [],
	selectedRepo: null,
	worktreesByRepo: {},
	selectedWorktree: null,
	worktreeByRepo: {},
	ptySessions: {},
	activeTab: {},
	showHidden: false,
	worktreeLabels: {},
	setRepos: (repos) => set({ repos }),
	setWorktreeLabels: (worktreeLabels) => set({ worktreeLabels }),
	toggleShowHidden: () => set((s) => ({ showHidden: !s.showHidden })),
	selectRepo: (repo) =>
		set((s) => {
			if (!repo) return { selectedRepo: null, selectedWorktree: null };
			const remembered = s.worktreeByRepo[repo.path];
			const wts = s.worktreesByRepo[repo.path] ?? [];
			const match = remembered
				? wts.find((wt) => wt.path === remembered)
				: undefined;
			return { selectedRepo: repo, selectedWorktree: match ?? null };
		}),
	setWorktreesByRepo: (worktreesByRepo) => set({ worktreesByRepo }),
	setWorktreesForRepo: (repoPath, worktrees) =>
		set((s) => {
			const next = { ...s.worktreesByRepo, [repoPath]: worktrees };
			let selectedWorktree = s.selectedWorktree;
			if (
				selectedWorktree &&
				s.selectedRepo?.path === repoPath &&
				!worktrees.find((wt) => wt.path === selectedWorktree!.path)
			) {
				selectedWorktree = null;
			}
			return { worktreesByRepo: next, selectedWorktree };
		}),
	removeWorktreesForRepo: (repoPath) =>
		set((s) => {
			const next = { ...s.worktreesByRepo };
			delete next[repoPath];
			const memory = { ...s.worktreeByRepo };
			delete memory[repoPath];
			return { worktreesByRepo: next, worktreeByRepo: memory };
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
