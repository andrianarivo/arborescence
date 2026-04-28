import { useEffect, useRef, useCallback } from 'react';
import { RepoList } from './components/RepoList';
import { WorktreeList } from './components/WorktreeList';
import { Terminal } from './components/Terminal';
import { useAppStore } from './store/appStore';
import { useConfig } from './hooks/useConfig';
import './App.css';

export default function App() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const terminalHeight = useAppStore((s) => s.terminalHeight);
	const setTerminalHeight = useAppStore((s) => s.setTerminalHeight);
	const { loadConfig } = useConfig();
	const appRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		loadConfig();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleDrag = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			const startY = e.clientY;
			const startH = terminalHeight;

			const onMove = (ev: MouseEvent) => {
				const h = Math.min(600, Math.max(150, startH - (ev.clientY - startY)));
				if (appRef.current) {
					appRef.current.style.gridTemplateRows = `1fr 4px ${h}px`;
				}
			};

			const onUp = (ev: MouseEvent) => {
				const h = Math.min(600, Math.max(150, startH - (ev.clientY - startY)));
				setTerminalHeight(h);
				document.body.style.cursor = '';
				document.body.style.userSelect = '';
				document.removeEventListener('mousemove', onMove);
				document.removeEventListener('mouseup', onUp);
			};

			document.body.style.cursor = 'row-resize';
			document.body.style.userSelect = 'none';
			document.addEventListener('mousemove', onMove);
			document.addEventListener('mouseup', onUp);
		},
		[terminalHeight, setTerminalHeight],
	);

	useEffect(() => {
		if (!appRef.current) return;
		if (selectedWorktree) {
			appRef.current.style.gridTemplateRows = `1fr 4px ${terminalHeight}px`;
		} else {
			appRef.current.style.gridTemplateRows = '';
		}
	}, [selectedWorktree, terminalHeight]);

	return (
		<div
			ref={appRef}
			className={`app ${selectedWorktree ? 'with-terminal' : ''}`}
		>
			<RepoList />
			<WorktreeList />
			{selectedWorktree && (
				<div className="resize-handle" onMouseDown={handleDrag} />
			)}
			<Terminal />
		</div>
	);
}
