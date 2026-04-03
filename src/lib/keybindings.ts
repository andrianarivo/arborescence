import { invoke } from '@tauri-apps/api/core';

type RawKeybinding = {
	keys: string;
	action?: string;
	send?: string;
};

type ParsedKeybinding = {
	meta: boolean;
	alt: boolean;
	shift: boolean;
	ctrl: boolean;
	key: string;
	data: string;
};

const ACTIONS: Record<string, string> = {
	'beginning-of-line': '\x01',
	'end-of-line': '\x05',
	'kill-line': '\x15',
	'word-back': '\x1bb',
	'word-forward': '\x1bf',
	newline: '\n',
};

const KEY_MAP: Record<string, string> = {
	left: 'ArrowLeft',
	right: 'ArrowRight',
	up: 'ArrowUp',
	down: 'ArrowDown',
	enter: 'Enter',
	backspace: 'Backspace',
	tab: 'Tab',
	escape: 'Escape',
	space: ' ',
	delete: 'Delete',
};

function parseEscapes(s: string): string {
	return s
		.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
			String.fromCharCode(parseInt(hex, 16)),
		)
		.replace(/\\e/g, '\x1b')
		.replace(/\\n/g, '\n')
		.replace(/\\r/g, '\r')
		.replace(/\\t/g, '\t')
		.replace(/\\\\/g, '\\');
}

function resolveData(binding: RawKeybinding): string | null {
	if (binding.action) return ACTIONS[binding.action] ?? null;
	if (binding.send) return parseEscapes(binding.send);
	return null;
}

function parseKeys(keys: string): Omit<ParsedKeybinding, 'data'> {
	const parts = keys.toLowerCase().split('+');
	const keyName = parts[parts.length - 1];
	const mods = new Set(parts.slice(0, -1));
	return {
		meta: mods.has('cmd') || mods.has('meta'),
		alt: mods.has('alt') || mods.has('option'),
		shift: mods.has('shift'),
		ctrl: mods.has('ctrl'),
		key: KEY_MAP[keyName] || keyName,
	};
}

function parseKeybindings(raw: RawKeybinding[]): ParsedKeybinding[] {
	const result: ParsedKeybinding[] = [];
	for (const b of raw) {
		const data = resolveData(b);
		if (data) result.push({ ...parseKeys(b.keys), data });
	}
	return result;
}

let cached: ParsedKeybinding[] | null = null;

export async function loadKeybindings(): Promise<ParsedKeybinding[]> {
	if (cached) return cached;
	const raw = await invoke<RawKeybinding[]>('read_keybindings');
	cached = parseKeybindings(raw);
	return cached;
}

export function matchKeybinding(
	event: KeyboardEvent,
	bindings: ParsedKeybinding[],
): string | null {
	for (const b of bindings) {
		if (
			event.metaKey === b.meta &&
			event.altKey === b.alt &&
			event.shiftKey === b.shift &&
			event.ctrlKey === b.ctrl &&
			event.key === b.key
		) {
			return b.data;
		}
	}
	return null;
}
