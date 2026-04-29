import { useEffect } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import { Terminal } from './components/Terminal';
import { EmptyState } from './components/EmptyState';
import { useAppStore } from './store/appStore';
import { useConfig } from './hooks/useConfig';
import './App.css';

export default function App() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const { loadConfig } = useConfig();

	useEffect(() => {
		loadConfig();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="flex flex-col flex-1 h-screen overflow-hidden">
				{selectedWorktree ? <Terminal /> : <EmptyState />}
			</main>
		</SidebarProvider>
	);
}
