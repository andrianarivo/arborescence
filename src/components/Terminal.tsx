import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
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

function createXTerm(container: HTMLElement): { xterm: XTerm; fitAddon: FitAddon } {
	const xterm = new XTerm({
		allowProposedApi: true,
		cursorBlink: true,
		fontSize: 13,
		fontFamily:
			'"CaskaydiaCove NFM", "CaskaydiaCove Nerd Font Mono", Menlo, Monaco, "Courier New", monospace',
		theme: {
			background: '#1a1a2e',
			foreground: '#e0e0e0',
			cursor: '#e0e0e0',
			selectionBackground: '#3a3a5e',
		},
	});
	const fitAddon = new FitAddon();
	xterm.loadAddon(fitAddon);
	xterm.loadAddon(new Unicode11Addon());
	xterm.open(container);
	xterm.unicode.activeVersion = '11';
	fitAddon.fit();
	return { xterm, fitAddon };
}

export function Terminal() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const containerRef = useRef<HTMLDivElement>(null);
	const activePathRef = useRef<string | null>(null);

	const activateSession = useCallback(async (path: string) => {
		const container = containerRef.current;
		console.log('[Terminal] activateSession', { path, container: !!container });
		if (!container) return;

		// detach previous
		const prevPath = activePathRef.current;
		if (prevPath && prevPath !== path) {
			const prev = sessionsMap.get(prevPath);
			if (prev?.xterm.element?.parentElement) {
				prev.xterm.element.remove();
			}
		}
		activePathRef.current = path;

		// reattach existing
		const existing = sessionsMap.get(path);
		console.log('[Terminal] existing session?', !!existing);
		if (existing) {
			container.appendChild(existing.xterm.element!);
			existing.fitAddon.fit();
			const d = existing.fitAddon.proposeDimensions();
			if (d) {
				invoke('resize_pty', {
					sessionId: existing.sessionId,
					cols: d.cols,
					rows: d.rows,
				});
			}
			existing.xterm.focus();
			return;
		}

		// create new
		console.log('[Terminal] creating new session for', path);
		try {
			const { xterm, fitAddon } = createXTerm(container);
			console.log('[Terminal] xterm created, calling create_pty');
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

			sessionsMap.set(path, { xterm, fitAddon, sessionId, unlisten });
			useAppStore.getState().registerPty(path, sessionId);
			console.log('[Terminal] session ready', sessionId);
			xterm.focus();
		} catch (err) {
			console.error('Failed to create PTY session:', err);
		}
	}, []);

	useEffect(() => {
		const path = selectedWorktree?.path;
		console.log('[Terminal] useEffect path =', path, 'containerRef =', !!containerRef.current);
		if (!path) return;
		activateSession(path);
	}, [selectedWorktree?.path, activateSession]);

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

	if (!selectedWorktree) {
		return <div className="terminal-panel" style={{ display: 'none' }} ref={containerRef} />;
	}

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
