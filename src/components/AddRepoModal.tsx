import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { useConfig } from '../hooks/useConfig';
import { useWorktreeCache } from '../hooks/useWorktreeCache';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
	onClose: () => void;
};

export function AddRepoModal({ onClose }: Props) {
	const [path, setPath] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const { addRepo } = useConfig();
	const { refreshRepo } = useWorktreeCache();

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
			await refreshRepo(path);
			onClose();
		} catch (err) {
			setError(String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Ajouter un repo</DialogTitle>
						<DialogDescription>
							Selectionnez le dossier racine d'un depot git existant.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-2 py-4">
						<Label htmlFor="repo-path">Dossier</Label>
						<div className="flex gap-2">
							<Input
								id="repo-path"
								type="text"
								value={path}
								readOnly
								placeholder="Aucun dossier sélectionné"
								onClick={handleBrowse}
								className="cursor-pointer"
							/>
							<Button type="button" variant="secondary" onClick={handleBrowse}>
								Parcourir
							</Button>
						</div>
						{error && <p className="text-[12px] text-[color:var(--danger)]">{error}</p>}
					</div>
					<DialogFooter>
						<Button type="button" variant="secondary" onClick={onClose}>
							Annuler
						</Button>
						<Button type="submit" disabled={loading || !path}>
							{loading ? 'Validation...' : 'Ajouter'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
