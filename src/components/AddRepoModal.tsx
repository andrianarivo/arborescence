import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useConfig } from '../hooks/useConfig';

type Props = {
	onClose: () => void;
};

export function AddRepoModal({ onClose }: Props) {
	const [path, setPath] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { addRepo } = useConfig();

	const handleBrowse = async () => {
		const selected = await open({ directory: true, multiple: false });
		if (selected) setPath(selected);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!path) return;
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
					<div className="folder-picker">
						<input
							type="text"
							value={path}
							readOnly
							placeholder="Aucun dossier selectionne"
							onClick={handleBrowse}
						/>
						<button
							type="button"
							className="btn-secondary"
							onClick={handleBrowse}
						>
							Parcourir
						</button>
					</div>
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
