import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useWorktrees } from '../hooks/useWorktrees';
import { NewWorktreeModal } from './NewWorktreeModal';
import { ConfirmDialog } from './ConfirmDialog';
import type { Worktree } from '../types';

function timeAgo(isoDate: string): string {
	if (!isoDate) return '';
	const diff = Date.now() - new Date(isoDate).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export function WorktreeList() {
	const { selectedRepo, worktrees, selectedWorktree, selectWorktree } =
		useAppStore();
	const { deleteWorktree, checkUnpushed } = useWorktrees();
	const [showNewModal, setShowNewModal] = useState(false);
	const [wtToDelete, setWtToDelete] = useState<Worktree | null>(null);
	const [unpushedCommits, setUnpushedCommits] = useState<string[]>([]);

	if (!selectedRepo) {
		return (
			<div className="worktree-list">
				<div className="panel-header">
					<span>WORKTREES</span>
				</div>
				<div className="panel-content empty">Selectionnez un repo</div>
			</div>
		);
	}

	const handleOpenTerminal = (wt: Worktree) => {
		selectWorktree(wt);
	};

	const handleDeleteRequest = async (wt: Worktree) => {
		const commits = await checkUnpushed(wt.path);
		setUnpushedCommits(commits);
		setWtToDelete(wt);
	};

	const handleDelete = async () => {
		if (!wtToDelete) return;
		await deleteWorktree(wtToDelete.path);
		if (selectedWorktree?.path === wtToDelete.path) {
			selectWorktree(null);
		}
		setWtToDelete(null);
		setUnpushedCommits([]);
	};

	return (
		<div className="worktree-list">
			<div className="panel-header">
				<span>WORKTREES — {selectedRepo.name}</span>
			</div>
			<div className="panel-content">
				{worktrees.map((wt) => (
					<div
						key={wt.path}
						className={`list-item worktree-item ${selectedWorktree?.path === wt.path ? 'active' : ''}`}
						onClick={() => handleOpenTerminal(wt)}
						onDoubleClick={() => handleOpenTerminal(wt)}
					>
						<div className="worktree-info">
							<span className={`worktree-indicator ${wt.isMain ? 'main' : ''}`}>
								{wt.isMain ? '●' : ''}
							</span>
							<span className="worktree-name">
								{wt.isMain ? wt.branch : wt.name}
							</span>
						</div>
						<div className="worktree-meta">
							<span className="worktree-time">{timeAgo(wt.lastActivity)}</span>
							{!wt.isMain && (
								<button
									className="btn-delete"
									onClick={(e) => {
										e.stopPropagation();
										handleDeleteRequest(wt);
									}}
								>
									×
								</button>
							)}
						</div>
					</div>
				))}
			</div>
			<button className="btn-add" onClick={() => setShowNewModal(true)}>
				+ New worktree
			</button>
			{showNewModal && (
				<NewWorktreeModal onClose={() => setShowNewModal(false)} />
			)}
			{wtToDelete && (
				<ConfirmDialog
					title="Supprimer le worktree"
					message={
						unpushedCommits.length > 0
							? `Attention : ${unpushedCommits.length} commit(s) non pushe(s) !`
							: `Supprimer le worktree "${wtToDelete.name}" ?`
					}
					details={unpushedCommits}
					onConfirm={handleDelete}
					onCancel={() => {
						setWtToDelete(null);
						setUnpushedCommits([]);
					}}
				/>
			)}
		</div>
	);
}
