import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useRef } from 'react';
import { useAppStore } from '../store/appStore';

type PtyOutput = {
	session_id: string;
	data: string;
};

export function useTerminal() {
	const { activePtySession, setActivePty } = useAppStore();
	const unlistenRef = useRef<UnlistenFn | null>(null);

	const openTerminal = async (
		worktreePath: string,
		cols: number,
		rows: number,
		onData: (data: Uint8Array) => void,
	) => {
		await closeTerminal();

		const sessionId = await invoke<string>('create_pty', {
			worktreePath,
			cols,
			rows,
		});
		setActivePty(sessionId);

		unlistenRef.current = await listen<PtyOutput>('pty-output', (event) => {
			if (event.payload.session_id === sessionId) {
				const bytes = Uint8Array.from(atob(event.payload.data), (c) =>
					c.charCodeAt(0),
				);
				onData(bytes);
			}
		});

		return sessionId;
	};

	const sendInput = async (data: string) => {
		if (!activePtySession) return;
		await invoke('write_pty', { sessionId: activePtySession, data });
	};

	const resizeTerminal = async (cols: number, rows: number) => {
		if (!activePtySession) return;
		await invoke('resize_pty', { sessionId: activePtySession, cols, rows });
	};

	const closeTerminal = async () => {
		if (unlistenRef.current) {
			unlistenRef.current();
			unlistenRef.current = null;
		}
		if (activePtySession) {
			await invoke('kill_pty', { sessionId: activePtySession });
			setActivePty(null);
		}
	};

	return { openTerminal, sendInput, resizeTerminal, closeTerminal };
}
