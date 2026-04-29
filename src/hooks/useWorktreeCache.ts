import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import type { Worktree, WorktreeCache } from '../types';

export function useWorktreeCache() {
	const setWorktreesByRepo = useAppStore((s) => s.setWorktreesByRepo);
	const setWorktreesForRepo = useAppStore((s) => s.setWorktreesForRepo);

	const persist = async () => {
		const cache = useAppStore.getState().worktreesByRepo;
		await invoke('write_worktree_cache', { cache });
	};

	const refreshRepo = async (repoPath: string) => {
		try {
			const wts = await invoke<Worktree[]>('list_worktrees', { repoPath });
			setWorktreesForRepo(repoPath, wts);
			await persist();
		} catch {
			// ignore
		}
	};

	const bootstrap = async () => {
		const cache = await invoke<WorktreeCache>('read_worktree_cache');
		setWorktreesByRepo(cache);
		const visibleRepos = useAppStore.getState().repos.filter((r) => !r.hidden);
		const results = await Promise.allSettled(
			visibleRepos.map((r) =>
				invoke<Worktree[]>('list_worktrees', { repoPath: r.path }).then(
					(wts) => ({ repoPath: r.path, wts }),
				),
			),
		);
		for (const r of results) {
			if (r.status === 'fulfilled') {
				setWorktreesForRepo(r.value.repoPath, r.value.wts);
			}
		}
		await persist();
	};

	return { bootstrap, refreshRepo, persist };
}
