import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { UnlistenFn } from '@tauri-apps/api/event';
import { useAppStore } from '../store/appStore';

type State = {
	confirming: boolean;
	sessionCount: number;
};

export function useAppCloseGuard() {
	const [state, setState] = useState<State>({
		confirming: false,
		sessionCount: 0,
	});

	useEffect(() => {
		let unlisten: UnlistenFn | undefined;
		const win = getCurrentWindow();
		(async () => {
			unlisten = await win.onCloseRequested((event) => {
				const sessions = useAppStore.getState().ptySessions;
				const total = Object.values(sessions).reduce(
					(acc, list) => acc + list.length,
					0,
				);
				if (total === 0) return;
				event.preventDefault();
				setState({ confirming: true, sessionCount: total });
			});
		})();
		return () => {
			unlisten?.();
		};
	}, []);

	const cancel = () => setState({ confirming: false, sessionCount: 0 });

	const confirm = async () => {
		const sessions = useAppStore.getState().ptySessions;
		const allSids = Object.values(sessions).flat();
		await Promise.allSettled(
			allSids.map((sessionId) => invoke('kill_pty', { sessionId })),
		);
		try {
			await getCurrentWindow().destroy();
		} catch (err) {
			console.error('Failed to destroy window after PTY cleanup:', err);
			setState({ confirming: false, sessionCount: 0 });
		}
	};

	return { ...state, cancel, confirm };
}
