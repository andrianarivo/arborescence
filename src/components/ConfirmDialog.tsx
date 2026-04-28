type Props = {
	title: string;
	message: string;
	details?: string[];
	loading?: boolean;
	loadingLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmDialog({
	title,
	message,
	details,
	loading = false,
	loadingLabel = 'En cours...',
	onConfirm,
	onCancel,
}: Props) {
	return (
		<div
			className="modal-overlay"
			onClick={() => {
				if (!loading) onCancel();
			}}
		>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<h3>{title}</h3>
				<p>{message}</p>
				{details && details.length > 0 && (
					<ul className="confirm-details">
						{details.map((d, i) => (
							<li key={i}>{d}</li>
						))}
					</ul>
				)}
				<div className="modal-actions">
					<button
						className="btn-secondary"
						onClick={onCancel}
						disabled={loading}
					>
						Annuler
					</button>
					<button className="btn-danger" onClick={onConfirm} disabled={loading}>
						{loading ? (
							<span className="btn-loading">
								<span className="spinner" />
								{loadingLabel}
							</span>
						) : (
							'Confirmer'
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
