export type GithubProfile = {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  twitter_username: string | null;
  hireable: boolean | null;
  created_at: string;
  updated_at: string;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  type: "User" | "Organization";
  html_url: string;
  suspended_at?: string | null;
  starred_url?: string;
};

export type GithubRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  default_branch: string;
  updated_at: string;
  created_at: string;
  pushed_at: string;
  html_url: string;
  clone_url: string;
  ssh_url?: string;
  git_url?: string;
  archived: boolean;
  disabled?: boolean;
  fork: boolean;
  topics?: string[];
  size: number;
  homepage: string | null;
  visibility?: "public" | "private" | "internal";
  license?: {
    name: string | null;
    spdx_id: string | null;
  } | null;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  has_pages?: boolean;
  has_downloads?: boolean;
  has_discussions?: boolean;
  allow_forking?: boolean;
  is_template?: boolean;
  network_count?: number;
  subscribers_count?: number;
  allow_squash_merge?: boolean;
  allow_merge_commit?: boolean;
  allow_rebase_merge?: boolean;
  allow_auto_merge?: boolean;
  delete_branch_on_merge?: boolean;
};

export type RepoSummaryResponse = {
  summary: string;
  readmeExcerpt: string | null;
  additionalMarkdowns: Array<{ file: string; excerpt: string }>;
  techStack: string[];
  dependencySignals: string[];
  fileSignals: string[];
  languages: Record<string, number>;
  topics: string[];
  defaultBranch: string;
  license: string | null;
  homepage: string | null;
  openIssues: number;
  size: number;
  visibility: "public" | "private" | "internal";
  createdAt: string;
  pushedAt: string;
  cloneUrl: string;
  sshUrl?: string;
  gitUrl?: string;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  hasPages: boolean;
  hasDiscussions: boolean;
  allowForking: boolean;
  isTemplate: boolean;
  disabled: boolean;
  networkCount: number;
  subscribersCount: number;
  allowSquashMerge: boolean;
  allowMergeCommit: boolean;
  allowRebaseMerge: boolean;
  allowAutoMerge: boolean;
  deleteBranchOnMerge: boolean;
};

export type PullRequestItem = {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  merged_at: string | null;
  html_url: string;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  } | null;
  created_at: string;
  updated_at: string;
  base: {
    ref: string;
  };
};

export type PullRequestGroup = {
  base: string;
  count: number;
  recent: PullRequestItem[];
};

export type PRAnalytics = {
  mergeTimeDistribution: { range: string; count: number }[];
  averageReviewTurnaroundTime: number;
  prSizeAnalysis: {
    small: number;
    medium: number;
    large: number;
  };
  activeReviewers: { login: string; reviews: number }[];
  successRate: number;
  totalPRs: number;
  mergedPRs: number;
  closedPRs: number;
  openPRs: number;
};

export type ContributionData = {
  date: string;
  count: number;
};

export type ContributionHeatmapData = {
  contributions: ContributionData[];
  totalContributions: number;
  maxDailyContributions: number;
};

export type TimelineEventType = "commits" | "prs" | "issues" | "repos" | "stars";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  date: string;
  title: string;
  description?: string;
  url?: string;
  repo?: string;
  actor?: {
    login: string;
    avatar_url: string;
  };
};

export type TimelineData = {
  events: TimelineEvent[];
  totalEvents: number;
};

export type HealthScoreBreakdown = {
  documentation: number;
  maintenance: number;
  community: number;
  issueResponse: number;
  codeQuality: number;
};

export type RepoHealthScore = {
  overall: number;
  breakdown: HealthScoreBreakdown;
  recommendations: string[];
  lastCalculated: string;
};

export type DependencyNode = {
  id: string;
  name: string;
  version: string;
  type: "root" | "dependency" | "devDependency" | "peerDependency";
  ecosystem: "npm" | "python" | "rust" | "go" | "ruby" | "unknown";
};

export type DependencyEdge = {
  source: string;
  target: string;
  type: "direct" | "transitive";
};

export type DependencyGraph = {
  nodes: DependencyNode[];
  edges: DependencyEdge[];
  totalDependencies: number;
  totalDevDependencies: number;
  ecosystems: string[];
};

export type CollaborationNode = {
  id: string;
  login: string;
  avatar_url: string;
  contributions: number;
  repos: string[];
  type: "user" | "organization";
};

export type CollaborationEdge = {
  source: string;
  target: string;
  weight: number;
  repos: string[];
  types: ("pr" | "review" | "commit")[];
};

export type CollaborationNetwork = {
  nodes: CollaborationNode[];
  edges: CollaborationEdge[];
  totalCollaborators: number;
  totalRepos: number;
  mostActiveCollaborator: { login: string; contributions: number } | null;
};

export type CodeChurnData = {
  date: string;
  additions: number;
  deletions: number;
  netChange: number;
  commits: number;
};

export type DependencyHealth = {
  total: number;
  outdated: number;
  vulnerable: number;
  latest: number;
  ecosystems: Record<string, { total: number; outdated: number }>;
};

export type CodeQualityMetrics = {
  averagePRReviewTime: number;
  medianPRReviewTime: number;
  codeChurn: CodeChurnData[];
  averageChurnPerCommit: number;
  dependencyHealth: DependencyHealth;
  recommendations: string[];
  lastCalculated: string;
};
