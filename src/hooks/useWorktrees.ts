import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { useConfig } from './useConfig';
import { useWorktreeCache } from './useWorktreeCache';

export function useWorktrees() {
	const selectedRepo = useAppStore((s) => s.selectedRepo);
	const { removeWorktreeLabel } = useConfig();
	const { refreshRepo } = useWorktreeCache();

	const createWorktree = async (branch: string) => {
		if (!selectedRepo) return;
		await invoke('add_worktree', {
			repoPath: selectedRepo.path,
			branch,
		});
		await refreshRepo(selectedRepo.path);
	};

	const deleteWorktree = async (worktreePath: string) => {
		if (!selectedRepo) return;
		await invoke('remove_worktree', {
			repoPath: selectedRepo.path,
			worktreePath,
		});
		await removeWorktreeLabel(worktreePath);
		await refreshRepo(selectedRepo.path);
	};

	const checkUnpushed = async (worktreePath: string) => {
		return invoke<string[]>('check_unpushed', { worktreePath });
	};

	return { createWorktree, deleteWorktree, checkUnpushed };
}
