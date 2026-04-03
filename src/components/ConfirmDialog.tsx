type Props = {
	title: string;
	message: string;
	details?: string[];
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmDialog({
	title,
	message,
	details,
	onConfirm,
	onCancel,
}: Props) {
	return (
		<div className="modal-overlay" onClick={onCancel}>
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
					<button className="btn-secondary" onClick={onCancel}>
						Annuler
					</button>
					<button className="btn-danger" onClick={onConfirm}>
						Confirmer
					</button>
				</div>
			</div>
		</div>
	);
}
