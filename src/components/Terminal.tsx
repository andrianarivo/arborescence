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

type Session = {
	xterm: XTerm;
	fitAddon: FitAddon;
	sessionId: string;
	unlisten: UnlistenFn;
};

const sessionsMap = new Map<string, Session>();

export function Terminal() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const containerRef = useRef<HTMLDivElement>(null);
	const activePathRef = useRef<string | null>(null);

	const detachCurrent = useCallback(() => {
		const prevPath = activePathRef.current;
		if (!prevPath) return;
		const prev = sessionsMap.get(prevPath);
		if (prev?.xterm.element?.parentElement) {
			prev.xterm.element.remove();
		}
		activePathRef.current = null;
	}, []);

	const attachSession = useCallback(
		(path: string) => {
			if (!containerRef.current) return;
			detachCurrent();

			const session = sessionsMap.get(path);
			if (!session) return;

			containerRef.current.appendChild(session.xterm.element!);
			session.fitAddon.fit();
			const d = session.fitAddon.proposeDimensions();
			if (d) {
				invoke('resize_pty', {
					sessionId: session.sessionId,
					cols: d.cols,
					rows: d.rows,
				});
			}
			session.xterm.focus();
			activePathRef.current = path;
		},
		[detachCurrent],
	);

	const createSession = useCallback(
		async (path: string) => {
			if (!containerRef.current) return;
			detachCurrent();

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

			const sessionId = await invoke<string>('create_pty', {
				worktreePath: path,
				cols,
				rows,
			});

			const unlisten = await listen<PtyOutput>('pty-output', (event) => {
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

			const session: Session = { xterm, fitAddon, sessionId, unlisten };
			sessionsMap.set(path, session);
			useAppStore.getState().registerPty(path, sessionId);
			activePathRef.current = path;
			xterm.focus();
		},
		[detachCurrent],
	);

	useEffect(() => {
		const path = selectedWorktree?.path;
		if (!path || !containerRef.current) return;

		if (sessionsMap.has(path)) {
			attachSession(path);
		} else {
			createSession(path);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- rerun only when path changes
	}, [selectedWorktree?.path]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const observer = new ResizeObserver(() => {
			const path = activePathRef.current;
			if (!path) return;
			const session = sessionsMap.get(path);
			if (!session) return;
			session.fitAddon.fit();
			const d = session.fitAddon.proposeDimensions();
			if (d) {
				invoke('resize_pty', {
					sessionId: session.sessionId,
					cols: d.cols,
					rows: d.rows,
				});
			}
		});
		observer.observe(container);
		return () => observer.disconnect();
	}, []);

	const handleClose = useCallback(async () => {
		const path = activePathRef.current;
		if (!path) return;
		const session = sessionsMap.get(path);
		if (session) {
			session.unlisten();
			session.xterm.dispose();
			await invoke('kill_pty', { sessionId: session.sessionId });
			sessionsMap.delete(path);
			useAppStore.getState().unregisterPty(path);
		}
		activePathRef.current = null;
		useAppStore.getState().selectWorktree(null);
	}, []);

	if (!selectedWorktree) return null;

	return (
		<div className="terminal-panel">
			<div className="panel-header">
				<span>TERMINAL — {selectedWorktree.name}</span>
				<button className="btn-close" onClick={handleClose}>
					×
				</button>
			</div>
			<div className="terminal-container" ref={containerRef} />
		</div>
	);
}
