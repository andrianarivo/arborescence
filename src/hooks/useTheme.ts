import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'arborescence:theme';

function getInitialTheme(): Theme {
	if (typeof window === 'undefined') return 'dark';
	const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
	if (saved === 'light' || saved === 'dark') return saved;
	return window.matchMedia('(prefers-color-scheme: dark)').matches
		? 'dark'
		: 'light';
}

if (typeof window !== 'undefined') {
	document.documentElement.classList.toggle(
		'dark',
		getInitialTheme() === 'dark',
	);
}

function readTheme(): Theme {
	if (typeof document === 'undefined') return 'dark';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(cb: () => void) {
	const obs = new MutationObserver(cb);
	obs.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['class'],
	});
	return () => obs.disconnect();
}

function applyTheme(t: Theme) {
	document.documentElement.classList.toggle('dark', t === 'dark');
	localStorage.setItem(STORAGE_KEY, t);
}

const getServerTheme = (): Theme => 'dark';

export function useTheme() {
	const theme = useSyncExternalStore<Theme>(
		subscribe,
		readTheme,
		getServerTheme,
	);
	const setTheme = (t: Theme) => applyTheme(t);
	const toggle = () => applyTheme(theme === 'dark' ? 'light' : 'dark');
	return { theme, setTheme, toggle };
}
