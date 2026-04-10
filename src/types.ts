export interface Config {
  ghUser: string;
  ghOrg: string;
}

export interface PeriodRange {
  label: string;
  start: string;
  end: string;
}

export interface PR {
  number: number;
  title: string;
  url: string;
  repo: string;
  repoFullName: string;
  closedAt: string;
  state: "MERGED" | "CLOSED" | "OPEN";
  labels: string[];
}

export interface Commit {
  sha: string;
  message: string;
  repo: string;
  date: string;
  url: string;
}

export interface GitHubData {
  period: string;
  collectedAt: string;
  author: string;
  org: string;
  prs: PR[];
  commits: Commit[];
}

export interface JiraIssue {
  key: string;
  summary: string;
  type: string;
  status: string;
  storyPoints: number | null;
  epic: string | null;
  epicSummary: string | null;
  labels: string[];
  sprint: string | null;
  resolvedAt: string | null;
  url: string;
}

export interface JiraData {
  period: string;
  collectedAt: string;
  issues: JiraIssue[];
  sprints: string[];
  epics: string[];
}
