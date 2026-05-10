import { Logo } from './Logo';

export function EmptyState() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 select-none">
			<Logo
				size={96}
				glyphClassName="text-[color:var(--text-faint)] opacity-60"
			/>
			<div className="flex flex-col items-center gap-1.5">
				<h2 className="text-[22px] font-bold tracking-[-0.02em] text-[color:var(--text-primary)]">
					Aucun worktree selectionne
				</h2>
				<p className="text-[13px] text-[color:var(--text-muted)]">
					Selectionnez un worktree dans la barre laterale pour ouvrir un
					terminal.
				</p>
			</div>
		</div>
	);
}
