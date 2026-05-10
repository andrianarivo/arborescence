import { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
} from '@/components/ui/sidebar';
import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';
import { useWorktreeCache } from '../hooks/useWorktreeCache';
import { AddRepoModal } from './AddRepoModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Logo } from './Logo';
import { RepoSidebarItem } from './RepoSidebarItem';
import { SidebarResizeHandle } from './SidebarResizeHandle';
import type { Repo } from '../types';

const APP_VERSION = 'v0.1';

export function AppSidebar() {
	const {
		repos,
		selectedRepo,
		selectRepo,
		showHidden,
		toggleShowHidden,
		removeWorktreesForRepo,
		ptySessions,
	} = useAppStore();
	const { removeRepo } = useConfig();
	const { persist } = useWorktreeCache();
	const [showAddModal, setShowAddModal] = useState(false);
	const [repoToDelete, setRepoToDelete] = useState<Repo | null>(null);

	const visibleRepos = showHidden ? repos : repos.filter((r) => !r.hidden);
	const sessionCount = Object.values(ptySessions).reduce(
		(acc, list) => acc + list.length,
		0,
	);

	const handleRemove = async () => {
		if (!repoToDelete) return;
		await removeRepo(repoToDelete.path);
		removeWorktreesForRepo(repoToDelete.path);
		await persist();
		if (selectedRepo?.path === repoToDelete.path) {
			selectRepo(null);
		}
		setRepoToDelete(null);
	};

	return (
		<Sidebar
			collapsible="none"
			className="relative bg-[color:var(--sidebar-bg)] border-r border-[color:var(--border-subtle)]"
		>
			<SidebarHeader className="flex-row items-center justify-between gap-2 px-3.5 py-3 border-b border-[color:var(--border-subtle)]">
				<Logo size={18} withWordmark />
				<span className="font-mono text-[10px] text-[color:var(--text-faint)] tabular-nums">
					{APP_VERSION}
				</span>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup className="px-2 pt-3">
					<div className="flex items-center justify-between px-2 pb-1">
						<span className="font-mono text-[9.5px] tracking-[0.06em] uppercase text-[color:var(--text-faint)]">
							Repos
						</span>
						<button
							type="button"
							onClick={toggleShowHidden}
							title={
								showHidden
									? 'Masquer les repos caches'
									: 'Afficher les repos caches'
							}
							className="text-[color:var(--text-faint)] hover:text-[color:var(--text-tertiary)] transition-colors p-1 rounded"
						>
							{showHidden ? (
								<Eye className="size-3.5" />
							) : (
								<EyeOff className="size-3.5" />
							)}
						</button>
					</div>
					<SidebarMenu>
						{visibleRepos.map((repo) => (
							<RepoSidebarItem
								key={repo.path}
								repo={repo}
								onRequestRemove={setRepoToDelete}
							/>
						))}
						<li className="mt-1">
							<button
								type="button"
								onClick={() => setShowAddModal(true)}
								className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] text-[color:var(--text-tertiary)] hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-primary)] transition-colors"
							>
								<Plus className="size-3.5" />
								<span>Ajouter un repo</span>
							</button>
						</li>
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="px-3.5 py-2.5 border-t border-[color:var(--border-subtle)] bg-[color:var(--bg-overlay)]">
				<div className="flex items-center justify-between text-[11px]">
					<span className="inline-flex items-center gap-2 text-[color:var(--text-tertiary)]">
						<span
							className="size-1.5 rounded-full bg-[color:var(--success)]"
							style={{ boxShadow: '0 0 6px var(--success)' }}
						/>
						{sessionCount > 0 ? 'PTY actif' : 'Inactif'}
					</span>
					<span className="font-mono text-[10px] text-[color:var(--text-faint)] tabular-nums">
						{sessionCount} session{sessionCount > 1 ? 's' : ''}
					</span>
				</div>
			</SidebarFooter>

			<SidebarResizeHandle />
			{showAddModal && <AddRepoModal onClose={() => setShowAddModal(false)} />}
			{repoToDelete && (
				<ConfirmDialog
					title="Retirer le repo"
					message={`Retirer "${repoToDelete.name}" de la liste ?`}
					onConfirm={handleRemove}
					onCancel={() => setRepoToDelete(null)}
				/>
			)}
		</Sidebar>
	);
}
