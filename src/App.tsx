import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RepoList } from './components/RepoList';
import { WorktreeList } from './components/WorktreeList';
import { Terminal } from './components/Terminal';
import { useAppStore } from './store/appStore';
import type { Config } from './types';
import './App.css';

export default function App() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const setRepos = useAppStore((s) => s.setRepos);
	const appRef = useRef<HTMLDivElement>(null);
	const terminalHeight = useRef(300);

	useEffect(() => {
		invoke<Config>('read_config').then((config) => setRepos(config.repos));
	}, [setRepos]);

	const handleDrag = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		const startY = e.clientY;
		const startH = terminalHeight.current;

		const onMove = (ev: MouseEvent) => {
			const h = Math.min(600, Math.max(150, startH - (ev.clientY - startY)));
			terminalHeight.current = h;
			if (appRef.current) {
				appRef.current.style.gridTemplateRows = `1fr 4px ${h}px`;
			}
		};

		const onUp = () => {
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
			document.removeEventListener('mousemove', onMove);
			document.removeEventListener('mouseup', onUp);
		};

		document.body.style.cursor = 'row-resize';
		document.body.style.userSelect = 'none';
		document.addEventListener('mousemove', onMove);
		document.addEventListener('mouseup', onUp);
	}, []);

	return (
		<div
			ref={appRef}
			className={`app ${selectedWorktree ? 'with-terminal' : ''}`}
		>
			<RepoList />
			<WorktreeList />
			{selectedWorktree && <div className="resize-handle" onMouseDown={handleDrag} />}
			<Terminal />
		</div>
	);
}
