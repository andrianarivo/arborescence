import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';
import { AddRepoModal } from './AddRepoModal';
import { ConfirmDialog } from './ConfirmDialog';
import type { Repo, Worktree } from '../types';

export function RepoList() {
	const { repos, selectedRepo, selectRepo } = useAppStore();
	const { removeRepo } = useConfig();
	const [showAddModal, setShowAddModal] = useState(false);
	const [repoToDelete, setRepoToDelete] = useState<Repo | null>(null);

	const handleSelect = async (repo: Repo) => {
		selectRepo(repo);
		try {
			const wts = await invoke<Worktree[]>('list_worktrees', {
				repoPath: repo.path,
			});
			useAppStore.getState().setWorktrees(wts);
		} catch {
			// ignore
		}
	};

	const handleRemove = async () => {
		if (!repoToDelete) return;
		await removeRepo(repoToDelete.path);
		if (selectedRepo?.path === repoToDelete.path) {
			selectRepo(null);
		}
		setRepoToDelete(null);
	};

	return (
		<div className="repo-list">
			<div className="panel-header">
				<span>REPOS</span>
			</div>
			<div className="panel-content">
				{repos.map((repo) => (
					<div
						key={repo.path}
						className={`list-item ${selectedRepo?.path === repo.path ? 'active' : ''}`}
						onClick={() => handleSelect(repo)}
						onContextMenu={(e) => {
							e.preventDefault();
							setRepoToDelete(repo);
						}}
					>
						{repo.name}
					</div>
				))}
			</div>
			<button className="btn-add" onClick={() => setShowAddModal(true)}>
				+ Add repo
			</button>
			{showAddModal && <AddRepoModal onClose={() => setShowAddModal(false)} />}
			{repoToDelete && (
				<ConfirmDialog
					title="Retirer le repo"
					message={`Retirer "${repoToDelete.name}" de la liste ?`}
					onConfirm={handleRemove}
					onCancel={() => setRepoToDelete(null)}
				/>
			)}
		</div>
	);
}
