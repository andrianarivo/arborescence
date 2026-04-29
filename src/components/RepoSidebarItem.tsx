import { useEffect, useRef, useState } from 'react';
import {
	ChevronRight,
	Eye,
	EyeOff,
	Pencil,
	Plus,
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
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';
import { useWorktrees } from '../hooks/useWorktrees';
import { ConfirmDialog } from './ConfirmDialog';
import { NewWorktreeModal } from './NewWorktreeModal';
import type { Repo, Worktree } from '../types';

function timeAgo(isoDate: string): string {
	if (!isoDate) return '';
	const diff = Date.now() - new Date(isoDate).getTime();
	const minutes = Math.floor(diff / 60000);
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
	const isOpen = selectedRepo?.path === repo.path;
	const worktrees = worktreesByRepo[repo.path] ?? [];

	const [showNewWorktree, setShowNewWorktree] = useState(false);
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

	const handleToggle = (next: boolean) => {
		selectRepo(next ? repo : null);
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

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={handleToggle}
			asChild
			className="group/collapsible border-b border-sidebar-border last:border-b-0"
		>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton
						className={`h-10 pr-16 ${repo.hidden ? 'opacity-50' : ''}`}
						tooltip={repo.name}
					>
						<ChevronRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
						<span className="truncate">{repo.name}</span>
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<SidebarMenuAction
					showOnHover
					className="right-8"
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
					className="hover:text-destructive"
					onClick={(e) => {
						e.stopPropagation();
						onRequestRemove(repo);
					}}
				>
					<Trash2 />
				</SidebarMenuAction>
				<CollapsibleContent>
					<SidebarMenuSub>
						{isOpen &&
							worktrees.map((wt) => {
								const label = worktreeLabels[wt.path];
								const defaultName = wt.isMain ? wt.branch : wt.name;
								const isRenaming = renamingPath === wt.path;
								const active = selectedWorktree?.path === wt.path;
								return (
									<SidebarMenuSubItem key={wt.path}>
										<SidebarMenuSubButton asChild isActive={active}>
											<div
												role="button"
												tabIndex={0}
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
												className="group/wt h-9 py-2 cursor-pointer border-b border-b-sidebar-border last:border-b-0 data-[active=true]:border-l-2 data-[active=true]:border-l-primary"
											>
												<span
													className={
														wt.isMain
															? 'text-emerald-500 text-xs'
															: 'text-muted-foreground text-xs w-2'
													}
												>
													{wt.isMain ? '●' : ''}
												</span>
												{isRenaming ? (
													<input
														ref={inputRef}
														className="flex-1 min-w-0 bg-background border border-ring rounded-sm px-1.5 py-0.5 text-xs outline-none"
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
													<div className="flex flex-col min-w-0 flex-1">
														<span className="truncate text-sm">
															{label ?? defaultName}
														</span>
														{label && (
															<span className="truncate text-[10px] text-muted-foreground">
																{defaultName}
															</span>
														)}
													</div>
												)}
												<span className="text-[10px] text-muted-foreground ml-auto shrink-0">
													{timeAgo(wt.lastActivity)}
												</span>
												{!isRenaming && (
													<button
														type="button"
														className="opacity-0 group-hover/wt:opacity-100 hover:text-foreground text-muted-foreground"
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
														className="opacity-0 group-hover/wt:opacity-100 text-muted-foreground hover:text-destructive"
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteRequest(wt);
														}}
													>
														<X className="size-3.5" />
													</button>
												)}
											</div>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								);
							})}
						{isOpen && (
							<SidebarMenuSubItem>
								<SidebarMenuSubButton
									onClick={() => setShowNewWorktree(true)}
									className="h-9 text-muted-foreground"
								>
									<Plus className="size-3.5" />
									<span>New worktree</span>
								</SidebarMenuSubButton>
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
