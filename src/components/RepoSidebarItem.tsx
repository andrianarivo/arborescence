import { useEffect, useRef, useState } from 'react';
import {
	Check,
	ChevronRight,
	Eye,
	EyeOff,
	Pencil,
	Plus,
	RefreshCw,
	Trash2,
	X,
} from 'lucide-react';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';
import { useWorktrees } from '../hooks/useWorktrees';
import { useWorktreeCache } from '../hooks/useWorktreeCache';
import { ConfirmDialog } from './ConfirmDialog';
import { NewWorktreeModal } from './NewWorktreeModal';
import type { Repo, Worktree } from '../types';

function timeAgo(isoDate: string): string {
	if (!isoDate) return '';
	const diff = Date.now() - new Date(isoDate).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'now';
	if (minutes < 60) return `${minutes}m`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h`;
	const days = Math.floor(hours / 24);
	return `${days}d`;
}

type Props = {
	repo: Repo;
	onRequestRemove: (repo: Repo) => void;
};

export function RepoSidebarItem({ repo, onRequestRemove }: Props) {
	const {
		selectedRepo,
		worktreesByRepo,
		selectedWorktree,
		selectRepo,
		selectWorktree,
		worktreeLabels,
	} = useAppStore();
	const { toggleHideRepo, setWorktreeLabel } = useConfig();
	const { deleteWorktree, checkUnpushed } = useWorktrees();
	const { refreshRepo } = useWorktreeCache();
	const isOpen = selectedRepo?.path === repo.path;
	const worktrees = worktreesByRepo[repo.path] ?? [];

	const [showNewWorktree, setShowNewWorktree] = useState(false);
	const [wtToDelete, setWtToDelete] = useState<Worktree | null>(null);
	const [unpushedCommits, setUnpushedCommits] = useState<string[]>([]);
	const [deleting, setDeleting] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [renamingPath, setRenamingPath] = useState<string | null>(null);
	const [draftLabel, setDraftLabel] = useState('');
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (renamingPath && inputRef.current) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [renamingPath]);

	const handleToggle = (next: boolean) => {
		selectRepo(next ? repo : null);
	};

	const handleRefresh = async () => {
		if (refreshing) return;
		setRefreshing(true);
		try {
			await refreshRepo(repo.path);
		} finally {
			setRefreshing(false);
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

	const handleDeleteRequest = async (wt: Worktree) => {
		const commits = await checkUnpushed(wt.path);
		setUnpushedCommits(commits);
		setWtToDelete(wt);
	};

	const handleConfirmDelete = async () => {
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

	const wtCount = worktrees.length;

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={handleToggle}
			asChild
			className="group/collapsible"
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						className={`h-8 px-2.5 pr-24 rounded-md text-[13px] font-medium tracking-[-0.01em] hover:bg-[color:var(--bg-hover)] data-[state=open]:bg-[color:var(--bg-hover)] ${repo.hidden ? 'opacity-50' : ''}`}
						tooltip={repo.name}
					>
						<ChevronRight className="size-3.5 text-[color:var(--text-muted)] transition-transform group-data-[state=open]/collapsible:rotate-90" />
						<span className="truncate text-[color:var(--text-secondary)] group-data-[state=open]/collapsible:text-[color:var(--text-primary)]">
							{repo.name}
						</span>
						{wtCount > 0 && (
							<span className="ml-auto font-mono text-[10px] text-[color:var(--text-muted)] tabular-nums px-1.5 py-px rounded-full bg-[color:var(--bg-active)]">
								{wtCount}
							</span>
						)}
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<SidebarMenuAction
					showOnHover
					className="right-16 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
					title="Rafraichir les worktrees"
					disabled={refreshing}
					onClick={(e) => {
						e.stopPropagation();
						handleRefresh();
					}}
				>
					<RefreshCw className={refreshing ? 'animate-spin' : ''} />
				</SidebarMenuAction>
				<SidebarMenuAction
					showOnHover
					className="right-8 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
					title={repo.hidden ? 'Afficher' : 'Cacher'}
					onClick={(e) => {
						e.stopPropagation();
						toggleHideRepo(repo.path);
					}}
				>
					{repo.hidden ? <Eye /> : <EyeOff />}
				</SidebarMenuAction>
				<SidebarMenuAction
					showOnHover
					title="Retirer"
					className="text-[color:var(--text-muted)] hover:text-[color:var(--danger)]"
					onClick={(e) => {
						e.stopPropagation();
						onRequestRemove(repo);
					}}
				>
					<Trash2 />
				</SidebarMenuAction>
				<CollapsibleContent>
					<SidebarMenuSub className="mx-0 px-0 border-l-0 gap-0.5 py-1.5">
						{isOpen &&
							worktrees.map((wt) => {
								const label = worktreeLabels[wt.path];
								const defaultName = wt.isMain ? wt.branch : wt.name;
								const isRenaming = renamingPath === wt.path;
								const active = selectedWorktree?.path === wt.path;
								return (
									<SidebarMenuSubItem key={wt.path}>
										<div
											role="button"
											tabIndex={0}
											data-active={active}
											onClick={() => !isRenaming && selectWorktree(wt)}
											onKeyDown={(e) => {
												if (
													(e.key === 'Enter' || e.key === ' ') &&
													!isRenaming
												) {
													e.preventDefault();
													selectWorktree(wt);
												}
											}}
											className="group/wt flex items-center gap-2 h-7 pl-5 pr-2.5 cursor-pointer rounded-md transition-colors hover:bg-[color:var(--bg-hover)] data-[active=true]:bg-[linear-gradient(90deg,var(--accent-bg-soft),var(--accent-bg-faint))] data-[active=true]:shadow-[inset_2px_0_0_var(--accent)]"
										>
											<span
												className="size-2 inline-flex items-center justify-center text-[11px]"
												style={{
													color: active
														? 'var(--accent)'
														: wt.isMain
															? 'var(--success)'
															: 'var(--text-faint)',
												}}
											>
												{wt.isMain || active ? '●' : '○'}
											</span>
											{isRenaming ? (
												<>
													<input
														ref={inputRef}
														className="flex-1 min-w-0 bg-[color:var(--bg-overlay)] border border-[color:var(--border-strong)] rounded-sm px-1.5 py-0.5 text-[12px] text-[color:var(--text-primary)] outline-none focus:border-[color:var(--accent)]"
														value={draftLabel}
														maxLength={50}
														onChange={(e) => setDraftLabel(e.target.value)}
														onClick={(e) => e.stopPropagation()}
														onKeyDown={(e) => {
															if (e.key === 'Enter') {
																e.preventDefault();
																e.stopPropagation();
																commitRename();
															} else if (e.key === 'Escape') {
																e.preventDefault();
																e.stopPropagation();
																cancelRename();
															}
														}}
													/>
													<button
														type="button"
														className="text-[color:var(--text-muted)] hover:text-[color:var(--success)] shrink-0"
														title="Valider"
														onMouseDown={(e) => {
															e.preventDefault();
															e.stopPropagation();
															commitRename();
														}}
														onClick={(e) => {
															e.preventDefault();
															e.stopPropagation();
														}}
													>
														<Check className="size-3.5" />
													</button>
													<button
														type="button"
														className="text-[color:var(--text-muted)] hover:text-[color:var(--danger)] shrink-0"
														title="Annuler"
														onMouseDown={(e) => {
															e.preventDefault();
															e.stopPropagation();
															cancelRename();
														}}
													>
														<X className="size-3.5" />
													</button>
												</>
											) : (
												<div className="flex flex-col min-w-0 flex-1">
													<span
														className="truncate text-[12.5px] tracking-[-0.01em]"
														style={{
															color: active
																? 'var(--text-primary)'
																: 'var(--text-secondary)',
															fontWeight: active ? 500 : 400,
														}}
													>
														{label ?? defaultName}
													</span>
													{label && (
														<span className="truncate font-mono text-[10px] text-[color:var(--text-faint)]">
															{defaultName}
														</span>
													)}
												</div>
											)}
											{!isRenaming && (
												<span className="font-mono text-[10px] text-[color:var(--text-faint)] ml-auto shrink-0 tabular-nums">
													{timeAgo(wt.lastActivity)}
												</span>
											)}
											{!isRenaming && (
												<button
													type="button"
													className="opacity-0 group-hover/wt:opacity-100 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-opacity"
													title={
														label ? 'Modifier le label' : 'Ajouter un label'
													}
													onClick={(e) => {
														e.stopPropagation();
														startRename(wt);
													}}
												>
													<Pencil className="size-3" />
												</button>
											)}
											{!wt.isMain && !isRenaming && (
												<button
													type="button"
													className="opacity-0 group-hover/wt:opacity-100 text-[color:var(--text-muted)] hover:text-[color:var(--danger)] transition-opacity"
													onClick={(e) => {
														e.stopPropagation();
														handleDeleteRequest(wt);
													}}
													aria-label="Supprimer le worktree"
												>
													<X className="size-3.5" />
												</button>
											)}
										</div>
									</SidebarMenuSubItem>
								);
							})}
						{isOpen && (
							<SidebarMenuSubItem>
								<button
									type="button"
									onClick={() => setShowNewWorktree(true)}
									className="w-full flex items-center gap-2 pl-5 pr-2.5 h-7 mt-0.5 rounded-md text-[11.5px] text-[color:var(--text-muted)] hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)] transition-colors"
								>
									<Plus className="size-3" />
									<span>Nouveau worktree</span>
								</button>
							</SidebarMenuSubItem>
						)}
					</SidebarMenuSub>
				</CollapsibleContent>
				{showNewWorktree && (
					<NewWorktreeModal onClose={() => setShowNewWorktree(false)} />
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
						onConfirm={handleConfirmDelete}
						onCancel={() => {
							setWtToDelete(null);
							setUnpushedCommits([]);
						}}
					/>
				)}
			</SidebarMenuItem>
		</Collapsible>
	);
}
