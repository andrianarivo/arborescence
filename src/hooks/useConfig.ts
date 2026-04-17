import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import type { Config, Repo } from '../types';

export function useConfig() {
	const { repos, setRepos } = useAppStore();

	const loadConfig = async () => {
		const config = await invoke<Config>('read_config');
		setRepos(config.repos);
	};

	const saveConfig = async (updatedRepos: Repo[]) => {
		await invoke('write_config', { config: { repos: updatedRepos } });
		setRepos(updatedRepos);
	};

	const addRepo = async (repo: Repo) => {
		const updated = [...repos, repo];
		await saveConfig(updated);
	};

	const removeRepo = async (path: string) => {
		const updated = repos.filter((r) => r.path !== path);
		await saveConfig(updated);
	};

	const toggleHideRepo = async (path: string) => {
		const updated = repos.map((r) =>
			r.path === path ? { ...r, hidden: !r.hidden } : r,
		);
		await saveConfig(updated);
	};

	return { loadConfig, addRepo, removeRepo, toggleHideRepo };
}
