import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useConfig } from '../hooks/useConfig';

type Props = {
	onClose: () => void;
};

export function AddRepoModal({ onClose }: Props) {
	const [path, setPath] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { addRepo } = useConfig();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setLoading(true);

		try {
			const valid = await invoke<boolean>('validate_repo', { path });
			if (!valid) {
				setError("Ce chemin n'est pas un repo git valide");
				return;
			}
			const name = path.split('/').pop() || path;
			await addRepo({ name, path });
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
				<h3>Ajouter un repo</h3>
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={path}
						onChange={(e) => setPath(e.target.value)}
						placeholder="/chemin/vers/le/repo"
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
							disabled={loading || !path}
						>
							{loading ? 'Validation...' : 'Ajouter'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
