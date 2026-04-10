import { execSync } from "node:child_process";
import type { Config, PeriodRange, PR, Commit } from "../types.js";

const MAX_PAGES = 5;
const PER_PAGE = 100;
const SHA_SHORT_LEN = 8;

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\ngh CLI error: ${message}`);
    console.error("Make sure 'gh' is installed and authenticated: gh auth login");
    process.exit(1);
    return undefined as never;
  }
}

type RawPR = {
  number: number;
  title: string;
  url: string;
  repository: { name: string; nameWithOwner: string };
  closedAt: string;
  state: "MERGED" | "CLOSED" | "OPEN";
  labels: Array<{ name: string }>;
};

export function collectPRs(range: PeriodRange, config: Config): PR[] {
  console.log(`  Fetching merged PRs between ${range.start} and ${range.end}...`);

  const fields = "number,title,url,repository,closedAt,state,labels";
  const raw = run(
    `gh search prs --author=${config.ghUser} --merged-at=${range.start}..${range.end} --owner=${config.ghOrg} --json ${fields} --limit 200`,
  );

  return (JSON.parse(raw) as RawPR[]).map((item) => ({
    number: item.number,
    title: item.title,
    url: item.url,
    repo: item.repository.name,
    repoFullName: item.repository.nameWithOwner,
    closedAt: item.closedAt,
    state: item.state,
    labels: item.labels.map((l) => l.name),
  }));
}

type RawCommit = {
  sha: string;
  commit: { message: string; committer: { date: string } };
  repository: { name: string };
  html_url: string;
};

export function collectCommits(range: PeriodRange, config: Config): Commit[] {
  console.log(`  Fetching commits between ${range.start} and ${range.end}...`);

  const query = `author:${config.ghUser}+org:${config.ghOrg}+committer-date:${range.start}..${range.end}`;
  const all: Commit[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const raw = run(
      `gh api "search/commits?q=${query}&per_page=${PER_PAGE}&page=${page}&sort=committer-date" --jq '.items[]'`,
    );

    if (!raw.trim()) break;

    const lines = raw.trim().split("\n");
    for (const line of lines) {
      const item = JSON.parse(line) as RawCommit;
      const msg = item.commit.message.split("\n")[0];
      const isMergeCommit = msg.startsWith("Merge pull request") || msg.startsWith("Merge branch");

      if (!isMergeCommit) {
        all.push({
          sha: item.sha.slice(0, SHA_SHORT_LEN),
          message: msg,
          repo: item.repository.name,
          date: item.commit.committer.date,
          url: item.html_url,
        });
      }
    }

    if (lines.length < PER_PAGE) break;
  }

  return all;
}
