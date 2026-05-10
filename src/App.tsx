import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import { Terminal } from './components/Terminal';
import { EmptyState } from './components/EmptyState';
import { ConfirmDialog } from './components/ConfirmDialog';
import { useAppStore } from './store/appStore';
import { useConfig } from './hooks/useConfig';
import { useWorktreeCache } from './hooks/useWorktreeCache';
import { useAppCloseGuard } from './hooks/useAppCloseGuard';
import './App.css';

export default function App() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const sidebarWidth = useAppStore((s) => s.sidebarWidth);
	const { loadConfig } = useConfig();
	const { bootstrap } = useWorktreeCache();
	const closeGuard = useAppCloseGuard();

	useEffect(() => {
		(async () => {
			await loadConfig();
			await bootstrap();
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<SidebarProvider
			className="h-svh"
			style={{ '--sidebar-width': `${sidebarWidth}px` } as React.CSSProperties}
		>
			<AppSidebar />
			<main className="flex flex-col flex-1 h-screen overflow-hidden">
				{selectedWorktree ? <Terminal /> : <EmptyState />}
			</main>
			{closeGuard.confirming && (
				<ConfirmDialog
					title="Quitter Arborescence ?"
					message={`${closeGuard.sessionCount} session${closeGuard.sessionCount > 1 ? 's' : ''} PTY active${closeGuard.sessionCount > 1 ? 's' : ''} ${closeGuard.sessionCount > 1 ? 'seront fermees' : 'sera fermee'}.`}
					onConfirm={closeGuard.confirm}
					onCancel={closeGuard.cancel}
				/>
			)}
		</SidebarProvider>
	);
}
