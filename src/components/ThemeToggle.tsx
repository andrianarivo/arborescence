import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
	const { theme, toggle } = useTheme();
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggle}
			aria-label="Basculer thème clair/sombre"
			title={theme === 'dark' ? 'Passer en clair' : 'Passer en sombre'}
		>
			{theme === 'dark' ? (
				<Sun className="size-4" />
			) : (
				<Moon className="size-4" />
			)}
		</Button>
	);
}
