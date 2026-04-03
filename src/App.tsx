import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RepoList } from './components/RepoList';
import { WorktreeList } from './components/WorktreeList';
import { Terminal } from './components/Terminal';
import { useAppStore } from './store/appStore';
import type { Config } from './types';
import './App.css';

export default function App() {
	const selectedWorktree = useAppStore((s) => s.selectedWorktree);
	const setRepos = useAppStore((s) => s.setRepos);

	useEffect(() => {
		invoke<Config>('read_config').then((config) => setRepos(config.repos));
	}, [setRepos]);

	return (
		<div className={`app ${selectedWorktree ? 'with-terminal' : ''}`}>
			<RepoList />
			<WorktreeList />
			<Terminal />
		</div>
	);
}
