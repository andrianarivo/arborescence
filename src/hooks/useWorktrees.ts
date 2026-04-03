import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import type { Worktree } from '../types';

export function useWorktrees() {
	const { selectedRepo, setWorktrees } = useAppStore();

	const loadWorktrees = async () => {
		if (!selectedRepo) return;
		const wts = await invoke<Worktree[]>('list_worktrees', {
			repoPath: selectedRepo.path,
		});
		setWorktrees(wts);
	};

	const createWorktree = async (branch: string) => {
		if (!selectedRepo) return;
		await invoke<Worktree>('add_worktree', {
			repoPath: selectedRepo.path,
			branch,
		});
		await loadWorktrees();
	};

	const deleteWorktree = async (worktreePath: string) => {
		await invoke('remove_worktree', { worktreePath });
		await loadWorktrees();
	};

	const checkUnpushed = async (worktreePath: string) => {
		return invoke<string[]>('check_unpushed', { worktreePath });
	};

	return { loadWorktrees, createWorktree, deleteWorktree, checkUnpushed };
}
