import { useState } from 'react';
import { Plus, Eye, EyeOff } from 'lucide-react';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';
import { useWorktreeCache } from '../hooks/useWorktreeCache';
import { AddRepoModal } from './AddRepoModal';
import { ConfirmDialog } from './ConfirmDialog';
import { RepoSidebarItem } from './RepoSidebarItem';
import { SidebarResizeHandle } from './SidebarResizeHandle';
import type { Repo } from '../types';

export function AppSidebar() {
	const {
		repos,
		selectedRepo,
		selectRepo,
		showHidden,
		toggleShowHidden,
		removeWorktreesForRepo,
	} = useAppStore();
	const { removeRepo } = useConfig();
	const { persist } = useWorktreeCache();
	const [showAddModal, setShowAddModal] = useState(false);
	const [repoToDelete, setRepoToDelete] = useState<Repo | null>(null);

	const visibleRepos = showHidden ? repos : repos.filter((r) => !r.hidden);

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
		<Sidebar collapsible="none" className="relative">
			<SidebarHeader className="flex-row items-center justify-between gap-1 px-4 py-3">
				<span className="text-xs font-semibold tracking-wider text-muted-foreground">
					REPOS
				</span>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleShowHidden}
						title={
							showHidden
								? 'Masquer les repos cachés'
								: 'Afficher les repos cachés'
						}
					>
						{showHidden ? (
							<Eye className="size-4" />
						) : (
							<EyeOff className="size-4" />
						)}
					</Button>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{visibleRepos.map((repo) => (
							<RepoSidebarItem
								key={repo.path}
								repo={repo}
								onRequestRemove={setRepoToDelete}
							/>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="p-3">
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => setShowAddModal(true)}
							className="h-10 text-primary"
						>
							<Plus className="size-4" />
							<span>Add repo</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
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
