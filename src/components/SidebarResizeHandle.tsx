import { useAppStore } from '../store/appStore';
import { useConfig } from '../hooks/useConfig';

const MIN_WIDTH = 128;
const MAX_WIDTH = 480;

const clamp = (n: number) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, n));

export function SidebarResizeHandle() {
	const setSidebarWidth = useAppStore((s) => s.setSidebarWidth);
	const { persistSidebarWidth } = useConfig();

	const onPointerDown = (e: React.PointerEvent) => {
		e.preventDefault();
		const startX = e.clientX;
		const startWidth = useAppStore.getState().sidebarWidth;
		const prevCursor = document.body.style.cursor;
		const prevSelect = document.body.style.userSelect;
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';

		const onMove = (ev: PointerEvent) => {
			setSidebarWidth(clamp(startWidth + (ev.clientX - startX)));
		};
		const onUp = () => {
			document.removeEventListener('pointermove', onMove);
			document.removeEventListener('pointerup', onUp);
			document.body.style.cursor = prevCursor;
			document.body.style.userSelect = prevSelect;
			void persistSidebarWidth();
		};
		document.addEventListener('pointermove', onMove);
		document.addEventListener('pointerup', onUp);
	};

	return (
		<div
			role="separator"
			aria-orientation="vertical"
			onPointerDown={onPointerDown}
			className="absolute top-0 right-0 bottom-0 z-20 w-1 cursor-col-resize bg-transparent transition-colors hover:bg-[color:var(--accent)]/40"
		/>
	);
}
