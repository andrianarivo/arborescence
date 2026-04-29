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
import { AddRepoModal } from './AddRepoModal';
import { ConfirmDialog } from './ConfirmDialog';
import ThemeToggle from './ThemeToggle';
import { RepoSidebarItem } from './RepoSidebarItem';
import type { Repo } from '../types';

export function AppSidebar() {
	const { repos, selectedRepo, selectRepo, showHidden, toggleShowHidden } =
		useAppStore();
	const { removeRepo } = useConfig();
	const [showAddModal, setShowAddModal] = useState(false);
	const [repoToDelete, setRepoToDelete] = useState<Repo | null>(null);

	const visibleRepos = showHidden ? repos : repos.filter((r) => !r.hidden);

	const handleRemove = async () => {
		if (!repoToDelete) return;
		await removeRepo(repoToDelete.path);
		if (selectedRepo?.path === repoToDelete.path) {
			selectRepo(null);
		}
		setRepoToDelete(null);
	};

	return (
		<Sidebar collapsible="none">
			<SidebarHeader className="flex-row items-center justify-between gap-1 px-3 py-2">
				<span className="text-xs font-semibold tracking-wider text-muted-foreground">
					REPOS
				</span>
				<div className="flex items-center gap-1">
					<ThemeToggle />
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
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => setShowAddModal(true)}
							className="text-primary"
						>
							<Plus className="size-4" />
							<span>Add repo</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
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
