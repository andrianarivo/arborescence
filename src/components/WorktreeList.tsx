import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';
import { useWorktrees } from '../hooks/useWorktrees';
import { useConfig } from '../hooks/useConfig';
import { NewWorktreeModal } from './NewWorktreeModal';
import { ConfirmDialog } from './ConfirmDialog';
import type { Worktree } from '../types';

function PencilIcon() {
	return (
		<svg
			width="13"
			height="13"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M12 20h9" />
			<path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z" />
		</svg>
	);
}

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
	const {
		selectedRepo,
		worktrees,
		selectedWorktree,
		selectWorktree,
		worktreeLabels,
	} = useAppStore();
	const { deleteWorktree, checkUnpushed } = useWorktrees();
	const { setWorktreeLabel } = useConfig();
	const [showNewModal, setShowNewModal] = useState(false);
	const [wtToDelete, setWtToDelete] = useState<Worktree | null>(null);
	const [unpushedCommits, setUnpushedCommits] = useState<string[]>([]);
	const [deleting, setDeleting] = useState(false);
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [draftLabel, setDraftLabel] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (renamingPath && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [renamingPath]);

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
		if (!wtToDelete || deleting) return;
		setDeleting(true);
		try {
			await deleteWorktree(wtToDelete.path);
			if (selectedWorktree?.path === wtToDelete.path) {
				selectWorktree(null);
			}
			setWtToDelete(null);
			setUnpushedCommits([]);
		} finally {
			setDeleting(false);
		}
	};

	const startRename = (wt: Worktree) => {
		setRenamingPath(wt.path);
		setDraftLabel(worktreeLabels[wt.path] ?? '');
	};

	const commitRename = async () => {
		if (!renamingPath) return;
		await setWorktreeLabel(renamingPath, draftLabel);
		setRenamingPath(null);
		setDraftLabel('');
	};

	const cancelRename = () => {
		setRenamingPath(null);
		setDraftLabel('');
	};

	return (
		<div className="worktree-list">
			<div className="panel-header">
				<span>WORKTREES — {selectedRepo.name}</span>
			</div>
			<div className="panel-content">
				{worktrees.map((wt) => {
					const label = worktreeLabels[wt.path];
					const defaultName = wt.isMain ? wt.branch : wt.name;
					const isRenaming = renamingPath === wt.path;
					return (
						<div
							key={wt.path}
							className={`list-item worktree-item ${selectedWorktree?.path === wt.path ? 'active' : ''}`}
							onClick={() => !isRenaming && handleOpenTerminal(wt)}
							onDoubleClick={() => !isRenaming && handleOpenTerminal(wt)}
						>
							<div className="worktree-info">
								<span
									className={`worktree-indicator ${wt.isMain ? 'main' : ''}`}
								>
									{wt.isMain ? '●' : ''}
								</span>
								{isRenaming ? (
									<input
										ref={inputRef}
										className="worktree-label-input"
										value={draftLabel}
										maxLength={50}
										onChange={(e) => setDraftLabel(e.target.value)}
										onClick={(e) => e.stopPropagation()}
										onKeyDown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												commitRename();
											} else if (e.key === 'Escape') {
												e.preventDefault();
												cancelRename();
											}
										}}
										onBlur={() => commitRename()}
									/>
								) : (
									<div className="worktree-name-group">
										<span className="worktree-name">
											{label ?? defaultName}
										</span>
										{label && (
											<span className="worktree-subtext">{defaultName}</span>
										)}
									</div>
								)}
							</div>
							<div className="worktree-meta">
								<span className="worktree-time">
									{timeAgo(wt.lastActivity)}
								</span>
								{!isRenaming && (
									<button
										className="btn-edit"
										title={label ? 'Modifier le label' : 'Ajouter un label'}
										onClick={(e) => {
											e.stopPropagation();
											startRename(wt);
										}}
									>
										<PencilIcon />
									</button>
								)}
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
					);
				})}
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
					loading={deleting}
					loadingLabel="Suppression..."
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
