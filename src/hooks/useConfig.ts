import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import type { Config, Repo } from '../types';

export function useConfig() {
	const {
		repos,
		setRepos,
		worktreeLabels,
		setWorktreeLabels,
		setSidebarWidth,
	} = useAppStore();

	const loadConfig = async () => {
		const config = await invoke<Config>('read_config');
		setRepos(config.repos ?? []);
		setWorktreeLabels(config.worktreeLabels ?? {});
		if (typeof config.sidebarWidth === 'number') {
			setSidebarWidth(config.sidebarWidth);
		}
	};

	const persist = async (
		updatedRepos: Repo[],
		updatedLabels: Record<string, string>,
	) => {
		const { sidebarWidth } = useAppStore.getState();
		await invoke('write_config', {
			config: {
				repos: updatedRepos,
				worktreeLabels: updatedLabels,
				sidebarWidth,
			},
		});
		setRepos(updatedRepos);
		setWorktreeLabels(updatedLabels);
	};

	const persistSidebarWidth = async () => {
		const {
			repos: r,
			worktreeLabels: l,
			sidebarWidth,
		} = useAppStore.getState();
		await invoke('write_config', {
			config: { repos: r, worktreeLabels: l, sidebarWidth },
		});
	};

	const addRepo = async (repo: Repo) => {
		await persist([...repos, repo], worktreeLabels);
	};

	const removeRepo = async (path: string) => {
		await persist(
			repos.filter((r) => r.path !== path),
			worktreeLabels,
		);
	};

	const toggleHideRepo = async (path: string) => {
		const updated = repos.map((r) =>
			r.path === path ? { ...r, hidden: !r.hidden } : r,
		);
		await persist(updated, worktreeLabels);
	};

	const setWorktreeLabel = async (worktreePath: string, label: string) => {
		const next = { ...worktreeLabels };
		const trimmed = label.trim();
		if (trimmed) {
			next[worktreePath] = trimmed.slice(0, 50);
		} else {
			delete next[worktreePath];
		}
		await persist(repos, next);
	};

	const removeWorktreeLabel = async (worktreePath: string) => {
		if (!(worktreePath in worktreeLabels)) return;
		const next = { ...worktreeLabels };
		delete next[worktreePath];
		await persist(repos, next);
	};

	return {
		loadConfig,
		addRepo,
		removeRepo,
		toggleHideRepo,
		setWorktreeLabel,
		removeWorktreeLabel,
		persistSidebarWidth,
	};
}
