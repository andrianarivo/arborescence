import { useState } from 'react';
import { useWorktrees } from '../hooks/useWorktrees';
import {
	Dialog,
	DialogContent,
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
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Nouveau worktree</DialogTitle>
					</DialogHeader>
					<div className="grid gap-2 py-4">
						<Label htmlFor="worktree-branch">Branche</Label>
						<Input
							id="worktree-branch"
							type="text"
							value={branch}
							onChange={(e) => setBranch(e.target.value)}
							placeholder="nom-de-branche"
							autoFocus
						/>
						{error && <p className="text-xs text-destructive">{error}</p>}
					</div>
					<DialogFooter>
						<Button type="button" variant="secondary" onClick={onClose}>
							Annuler
						</Button>
						<Button type="submit" disabled={loading || !branch}>
							{loading ? 'Création...' : 'Créer'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
