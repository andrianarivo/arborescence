import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';
import { AddRepoModal } from './AddRepoModal';
import { ConfirmDialog } from './ConfirmDialog';
import ThemeToggle from './ThemeToggle';
import type { Repo, Worktree } from '../types';

export function RepoList() {
	const { repos, selectedRepo, selectRepo, showHidden, toggleShowHidden } =
		useAppStore();
	const { removeRepo, toggleHideRepo } = useConfig();
	const [showAddModal, setShowAddModal] = useState(false);
	const [repoToDelete, setRepoToDelete] = useState<Repo | null>(null);
	const [contextRepo, setContextRepo] = useState<Repo | null>(null);
	const [contextPos, setContextPos] = useState({ x: 0, y: 0 });

	const visibleRepos = showHidden ? repos : repos.filter((r) => !r.hidden);

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
		<div className="repo-list" onClick={() => setContextRepo(null)}>
			<div className="panel-header">
				<span>REPOS</span>
				<div className="flex items-center gap-1">
					<ThemeToggle />
					<button
						className={`btn-toggle-hidden ${showHidden ? 'active' : ''}`}
						onClick={toggleShowHidden}
						title={
							showHidden
								? 'Masquer les repos cachés'
								: 'Afficher les repos cachés'
						}
					>
						{showHidden ? '◉' : '◎'}
					</button>
				</div>
			</div>
			<div className="panel-content">
				{visibleRepos.map((repo) => (
					<div
						key={repo.path}
						className={`list-item ${selectedRepo?.path === repo.path ? 'active' : ''} ${repo.hidden ? 'hidden-repo' : ''}`}
						onClick={() => handleSelect(repo)}
						onContextMenu={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setContextRepo(repo);
							setContextPos({ x: e.clientX, y: e.clientY });
						}}
					>
						{repo.name}
					</div>
				))}
			</div>
			<button className="btn-add" onClick={() => setShowAddModal(true)}>
				+ Add repo
			</button>
			{contextRepo && (
				<div
					className="context-menu"
					style={{ top: contextPos.y, left: contextPos.x }}
				>
					<button
						onClick={() => {
							toggleHideRepo(contextRepo.path);
							setContextRepo(null);
						}}
					>
						{contextRepo.hidden ? 'Afficher' : 'Cacher'}
					</button>
					<button
						onClick={() => {
							setRepoToDelete(contextRepo);
							setContextRepo(null);
						}}
					>
						Retirer
					</button>
				</div>
			)}
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
