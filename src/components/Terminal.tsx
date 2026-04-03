import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';
import { useAppStore } from '../store/appStore';

type PtyOutput = {
	session_id: string;
	data: string;
};

export function Terminal() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const containerRef = useRef<HTMLDivElement>(null);
	const sessionIdRef = useRef<string | null>(null);
	const unlistenRef = useRef<UnlistenFn | null>(null);

	const cleanup = useCallback(async () => {
		unlistenRef.current?.();
		unlistenRef.current = null;
		if (sessionIdRef.current) {
			await invoke('kill_pty', { sessionId: sessionIdRef.current });
			sessionIdRef.current = null;
			useAppStore.getState().setActivePty(null);
		}
	}, []);

	useEffect(() => {
		if (!selectedWorktree || !containerRef.current) return;

		const xterm = new XTerm({
			cursorBlink: true,
			fontSize: 13,
			fontFamily: 'Menlo, Monaco, "Courier New", monospace',
			theme: {
				background: '#1a1a2e',
				foreground: '#e0e0e0',
				cursor: '#e0e0e0',
				selectionBackground: '#3a3a5e',
			},
		});
		const fitAddon = new FitAddon();
		xterm.loadAddon(fitAddon);
		xterm.open(containerRef.current);
		fitAddon.fit();

		const dims = fitAddon.proposeDimensions();
		const cols = dims?.cols ?? 80;
		const rows = dims?.rows ?? 24;

		let cancelled = false;

		(async () => {
			await cleanup();
			if (cancelled) return;

			const sessionId = await invoke<string>('create_pty', {
				worktreePath: selectedWorktree.path,
				cols,
				rows,
			});
			if (cancelled) return;

			sessionIdRef.current = sessionId;
			useAppStore.getState().setActivePty(sessionId);

			unlistenRef.current = await listen<PtyOutput>('pty-output', (event) => {
				if (event.payload.session_id === sessionId) {
					const bytes = Uint8Array.from(atob(event.payload.data), (c) =>
						c.charCodeAt(0),
					);
					xterm.write(bytes);
				}
			});

			xterm.onData((data) => {
				invoke('write_pty', { sessionId, data });
			});
		})();

		const observer = new ResizeObserver(() => {
			fitAddon.fit();
			const d = fitAddon.proposeDimensions();
			if (d && sessionIdRef.current) {
				invoke('resize_pty', {
					sessionId: sessionIdRef.current,
					cols: d.cols,
					rows: d.rows,
				});
			}
		});
		observer.observe(containerRef.current);

		return () => {
			cancelled = true;
			observer.disconnect();
			xterm.dispose();
			cleanup();
		};
	// eslint-disable-next-line react-hooks/exhaustive-deps -- rerun only when path changes
	}, [selectedWorktree?.path, cleanup]);

	if (!selectedWorktree) return null;

	return (
		<div className="terminal-panel">
			<div className="panel-header">
				<span>TERMINAL — {selectedWorktree.name}</span>
				<button
					className="btn-close"
					onClick={() => {
						cleanup();
						useAppStore.getState().selectWorktree(null);
					}}
				>
					×
				</button>
			</div>
			<div className="terminal-container" ref={containerRef} />
		</div>
	);
}
