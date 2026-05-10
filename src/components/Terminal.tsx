import { useEffect, useRef, useCallback, useState } from 'react';
import { Terminal as XTerm, type ITheme } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { Unicode11Addon } from '@xterm/addon-unicode11';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import '@xterm/xterm/css/xterm.css';
import { useAppStore } from '../store/appStore';
import { loadKeybindings, matchKeybinding } from '../lib/keybindings';
import { ConfirmDialog } from './ConfirmDialog';

type PtyOutput = {
	session_id: string;
	data: string;
};

type Session = {
	xterm: XTerm;
	fitAddon: FitAddon;
	unlisten: UnlistenFn;
};

const sessionsMap = new Map<string, Session>();

const FONT_SIZE = 13;
const FONT_FAMILY =
	'"JetBrains Mono", "CaskaydiaCove NFM", "CaskaydiaCove Nerd Font Mono", Menlo, Monaco, "Courier New", monospace';

const TERMINAL_THEME: ITheme = {
	background: '#08080F',
	foreground: '#C8C8E0',
	cursor: '#5E6AFF',
	cursorAccent: '#08080F',
	selectionBackground: 'rgba(94, 106, 255, 0.25)',
	black: '#06060C',
	red: '#FF5F57',
	green: '#28C840',
	yellow: '#F5A524',
	blue: '#5E6AFF',
	magenta: '#B16BFF',
	cyan: '#5EE5E5',
	white: '#C8C8E0',
	brightBlack: '#4A4A66',
	brightRed: '#FF8A85',
	brightGreen: '#5BD96E',
	brightYellow: '#FFB94A',
	brightBlue: '#7F8AFF',
	brightMagenta: '#C28FFF',
	brightCyan: '#80EBEB',
	brightWhite: '#FFFFFF',
};

const MIN_CONTRAST_RATIO = 0;

async function ensureFontLoaded() {
	if (!document.fonts?.load) return;
	try {
		await document.fonts.load(`${FONT_SIZE}px "JetBrains Mono"`);
		await document.fonts.ready;
	} catch {
		// fallback font will be used
	}
}

function nextFrame(): Promise<void> {
	return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function createXTerm(container: HTMLElement): {
	xterm: XTerm;
	fitAddon: FitAddon;
} {
	const xterm = new XTerm({
		allowProposedApi: true,
		cursorBlink: true,
		fontSize: FONT_SIZE,
		fontFamily: FONT_FAMILY,
		theme: TERMINAL_THEME,
		minimumContrastRatio: MIN_CONTRAST_RATIO,
	});
	const fitAddon = new FitAddon();
	xterm.loadAddon(fitAddon);
	xterm.loadAddon(new Unicode11Addon());
	xterm.open(container);
	xterm.unicode.activeVersion = '11';
	return { xterm, fitAddon };
}

export function Terminal() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const ptySessions = useAppStore((s) => s.ptySessions);
	const activeTab = useAppStore((s) => s.activeTab);
	const containerRef = useRef<HTMLDivElement>(null);
	const activeSessionRef = useRef<string | null>(null);
	const [tabToClose, setTabToClose] = useState<string | null>(null);

	const path = selectedWorktree?.path;
	const tabs = path ? ptySessions[path] || [] : [];
	const tabIndex = path ? (activeTab[path] ?? 0) : 0;
	const activeSessionId = tabs[tabIndex] || null;

	const detachCurrent = useCallback(() => {
		const prev = activeSessionRef.current;
		if (!prev) return;
		const session = sessionsMap.get(prev);
		if (session?.xterm.element?.parentElement) {
			session.xterm.element.remove();
		}
		activeSessionRef.current = null;
	}, []);

	const attachSession = useCallback(
		(sessionId: string) => {
			const container = containerRef.current;
			if (!container) return;
			detachCurrent();

			const session = sessionsMap.get(sessionId);
			if (!session) return;

			container.appendChild(session.xterm.element!);
			requestAnimationFrame(() => {
				session.fitAddon.fit();
				const d = session.fitAddon.proposeDimensions();
				if (d) {
					invoke('resize_pty', { sessionId, cols: d.cols, rows: d.rows });
				}
			});
			session.xterm.focus();
			activeSessionRef.current = sessionId;
		},
		[detachCurrent],
	);

	const createNewTab = useCallback(async () => {
		if (!path || !containerRef.current) return;
		detachCurrent();

		try {
			await ensureFontLoaded();
			const { xterm, fitAddon } = createXTerm(containerRef.current);
			await nextFrame();
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

			const bindings = await loadKeybindings();
			xterm.attachCustomKeyEventHandler((event: KeyboardEvent): boolean => {
				if (event.type !== 'keydown') return true;
				const data = matchKeybinding(event, bindings);
				if (data) {
					event.preventDefault();
					invoke('write_pty', { sessionId, data });
					return false;
				}
				return true;
			});

			sessionsMap.set(sessionId, { xterm, fitAddon, unlisten });
			useAppStore.getState().registerPty(path, sessionId);
			activeSessionRef.current = sessionId;
			xterm.focus();
		} catch (err) {
			console.error('Failed to create PTY session:', err);
		}
	}, [path, detachCurrent]);

	const closeTab = useCallback(
		async (sessionId: string) => {
			if (!path) return;
			const session = sessionsMap.get(sessionId);
			if (session) {
				session.unlisten();
				session.xterm.dispose();
				await invoke('kill_pty', { sessionId });
				sessionsMap.delete(sessionId);
			}
			useAppStore.getState().unregisterPty(path, sessionId);

			const state = useAppStore.getState();
			const remaining = state.ptySessions[path];
			if (!remaining || remaining.length === 0) {
				activeSessionRef.current = null;
				useAppStore.getState().selectWorktree(null);
			}
		},
		[path],
	);

	// Auto-create first tab when selecting a worktree with no tabs
	useEffect(() => {
		if (!path) return;
		if (tabs.length === 0) {
			createNewTab();
		}
	}, [path, tabs.length, createNewTab]);

	// Attach active tab when it changes
	useEffect(() => {
		if (!activeSessionId) return;
		if (activeSessionRef.current === activeSessionId) return;
		attachSession(activeSessionId);
	}, [activeSessionId, attachSession]);

	// ResizeObserver
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let pending = 0;
		const observer = new ResizeObserver(() => {
			if (pending) cancelAnimationFrame(pending);
			pending = requestAnimationFrame(() => {
				pending = 0;
				const sid = activeSessionRef.current;
				if (!sid) return;
				const session = sessionsMap.get(sid);
				if (!session) return;
				session.fitAddon.fit();
				const d = session.fitAddon.proposeDimensions();
				if (d) {
					invoke('resize_pty', { sessionId: sid, cols: d.cols, rows: d.rows });
				}
			});
		});
		observer.observe(container);
		return () => {
			if (pending) cancelAnimationFrame(pending);
			observer.disconnect();
		};
	}, [selectedWorktree]);

	if (!selectedWorktree) {
		return (
			<div className="terminal-panel" style={{ display: 'none' }}>
				<div className="terminal-canvas" ref={containerRef} />
			</div>
		);
	}

	const repoName = useAppStore.getState().selectedRepo?.name ?? '';
	const wtName = selectedWorktree.name;

	return (
		<div className="terminal-panel">
			<div className="terminal-header">
				<div className="terminal-breadcrumb">
					<span>{repoName}</span>
					<span className="sep">/</span>
					<span className="current">{wtName}</span>
				</div>
				<div className="terminal-tabs">
					{tabs.map((sid, i) => (
						<div
							key={sid}
							className={`terminal-tab ${i === tabIndex ? 'active' : ''}`}
							onClick={() => useAppStore.getState().setActiveTab(path!, i)}
						>
							<span>Terminal {i + 1}</span>
							<button
								className="terminal-tab-close"
								onClick={(e) => {
									e.stopPropagation();
									setTabToClose(sid);
								}}
								aria-label={`Fermer terminal ${i + 1}`}
							>
								×
							</button>
						</div>
					))}
					<button
						className="terminal-tab-add"
						onClick={createNewTab}
						aria-label="Nouveau terminal"
					>
						+
					</button>
				</div>
			</div>
			<div className="terminal-container">
				<div className="terminal-canvas" ref={containerRef} />
			</div>
			{tabToClose && (
				<ConfirmDialog
					title="Fermer ce terminal ?"
					message="La session PTY associee sera terminee."
					onConfirm={async () => {
						const sid = tabToClose;
						setTabToClose(null);
						await closeTab(sid);
					}}
					onCancel={() => setTabToClose(null)}
				/>
			)}
		</div>
	);
}
