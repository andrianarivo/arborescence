type Props = {
	size?: number;
	withWordmark?: boolean;
	className?: string;
	glyphClassName?: string;
};

export function Logo({
	size = 18,
	withWordmark = false,
	className,
	glyphClassName,
}: Props) {
	return (
		<span
			className={`inline-flex items-center gap-2 ${className ?? ''}`}
			aria-label="Arborescence"
		>
			<svg
				width={size}
				height={size}
				viewBox="0 0 64 64"
				fill="none"
				className={glyphClassName ?? 'text-[color:var(--accent)]'}
				aria-hidden="true"
			>
				<circle cx="14" cy="14" r="6" fill="currentColor" />
				<circle cx="14" cy="50" r="5" stroke="currentColor" strokeWidth="2.5" />
				<circle cx="50" cy="32" r="5" stroke="currentColor" strokeWidth="2.5" />
				<path
					d="M14 20 L14 44 M14 20 Q14 32 44 32"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
				/>
			</svg>
			{withWordmark && (
				<span
					className="font-semibold tracking-[-0.01em] text-[color:var(--text-primary)]"
					style={{ fontSize: Math.round(size * 0.72) }}
				>
					Arborescence
				</span>
			)}
		</span>
	);
}
