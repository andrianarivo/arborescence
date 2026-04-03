import { useState } from 'react';
import { useWorktrees } from '../hooks/useWorktrees';

type Props = {
	onClose: () => void;
};

export function NewWorktreeModal({ onClose }: Props) {
	const [branch, setBranch] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { createWorktree } = useWorktrees();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			await createWorktree(branch);
			onClose();
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal" onClick={(e) => e.stopPropagation()}>
				<h3>Nouveau worktree</h3>
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={branch}
						onChange={(e) => setBranch(e.target.value)}
						placeholder="nom-de-branche"
						autoFocus
					/>
					{error && <p className="error">{error}</p>}
					<div className="modal-actions">
						<button type="button" className="btn-secondary" onClick={onClose}>
							Annuler
						</button>
						<button
							type="submit"
							className="btn-primary"
							disabled={loading || !branch}
						>
							{loading ? 'Creation...' : 'Creer'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
