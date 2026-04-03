export type Repo = {
	name: string;
	path: string;
};

export type Config = {
	repos: Repo[];
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
