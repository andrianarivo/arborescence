export type Repo = {
	name: string;
	path: string;
	hidden?: boolean;
};

export type Config = {
	repos: Repo[];
	worktreeLabels: Record<string, string>;
	sidebarWidth?: number;
};

export type Worktree = {
	name: string;
	branch: string;
	path: string;
	isMain: boolean;
	lastActivity: string;
};

export type PtySession = {
	sessionId: string;
	worktreePath: string;
};

export type WorktreeCache = Record<string, Worktree[]>;
