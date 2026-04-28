import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';
import { AddRepoModal } from './AddRepoModal';
import { ConfirmDialog } from './ConfirmDialog';
import ThemeToggle from './ThemeToggle';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { Repo, Worktree } from '../types';

export function RepoList() {
	const { repos, selectedRepo, selectRepo, showHidden, toggleShowHidden } =
		useAppStore();
	const { removeRepo, toggleHideRepo } = useConfig();
	const [showAddModal, setShowAddModal] = useState(false);
	const [repoToDelete, setRepoToDelete] = useState<Repo | null>(null);

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
		<div className="repo-list">
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
					<ContextMenu key={repo.path}>
						<ContextMenuTrigger asChild>
							<div
								className={`list-item ${selectedRepo?.path === repo.path ? 'active' : ''} ${repo.hidden ? 'hidden-repo' : ''}`}
								onClick={() => handleSelect(repo)}
							>
								{repo.name}
							</div>
						</ContextMenuTrigger>
						<ContextMenuContent>
							<ContextMenuItem onSelect={() => toggleHideRepo(repo.path)}>
								{repo.hidden ? 'Afficher' : 'Cacher'}
							</ContextMenuItem>
							<ContextMenuItem
								variant="destructive"
								onSelect={() => setRepoToDelete(repo)}
							>
								Retirer
							</ContextMenuItem>
						</ContextMenuContent>
					</ContextMenu>
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
