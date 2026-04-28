import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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
		<Dialog
			open
			onOpenChange={(o) => {
				if (!o && !loading) onCancel();
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{message}</DialogDescription>
				</DialogHeader>
				{details && details.length > 0 && (
					<ul className="max-h-32 overflow-y-auto pl-5 text-xs text-muted-foreground list-disc">
						{details.map((d, i) => (
							<li key={i}>{d}</li>
						))}
					</ul>
				)}
				<DialogFooter>
					<Button variant="secondary" onClick={onCancel} disabled={loading}>
						Annuler
					</Button>
					<Button variant="destructive" onClick={onConfirm} disabled={loading}>
						{loading ? (
							<span className="inline-flex items-center gap-2">
								<span className="size-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
								{loadingLabel}
							</span>
						) : (
							'Confirmer'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
