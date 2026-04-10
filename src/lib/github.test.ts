import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import { collectPRs, collectCommits } from "./github.js";
import type { Config, PeriodRange } from "../types.js";

vi.mock("node:child_process");

const config: Config = { ghUser: "john", ghOrg: "acme" };
const range: PeriodRange = { label: "Q1-2026", start: "2026-01-01", end: "2026-03-31" };

const rawPR = {
  number: 42,
  title: "feat: add something",
  url: "https://github.com/acme/repo/pull/42",
  repository: { name: "repo", nameWithOwner: "acme/repo" },
  closedAt: "2026-02-01T10:00:00Z",
  state: "MERGED" as const,
  labels: [{ name: "feature" }],
};

const rawCommitLine = JSON.stringify({
  sha: "abc1234567890",
  commit: { message: "fix: resolve bug\n\nBody text", committer: { date: "2026-02-10T09:00:00Z" } },
  repository: { name: "repo" },
  html_url: "https://github.com/acme/repo/commit/abc12345",
});

const mergeCommitLine = JSON.stringify({
  sha: "deadbeef12345",
  commit: {
    message: "Merge pull request #42 from feature-branch",
    committer: { date: "2026-02-11T09:00:00Z" },
  },
  repository: { name: "repo" },
  html_url: "https://github.com/acme/repo/commit/deadbeef",
});

const EXIT_ERROR = "process.exit(1)";

function exitThrows() {
  const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
    throw new Error(EXIT_ERROR);
  });
  const mockError = vi.spyOn(console, "error").mockImplementation(() => undefined);
  return { mockExit, mockError };
}

describe("collectPRs", () => {
  beforeEach(() => {
    vi.mocked(execSync).mockReturnValue(JSON.stringify([rawPR]) as any);
  });

  it("maps gh output to PR shape", () => {
    const prs = collectPRs(range, config);

    expect(prs).toHaveLength(1);
    expect(prs[0]).toEqual({
      number: 42,
      title: "feat: add something",
      url: "https://github.com/acme/repo/pull/42",
      repo: "repo",
      repoFullName: "acme/repo",
      closedAt: "2026-02-01T10:00:00Z",
      state: "MERGED",
      labels: ["feature"],
    });
  });

  it("returns empty array when no PRs found", () => {
    vi.mocked(execSync).mockReturnValue("[]" as any);
    expect(collectPRs(range, config)).toEqual([]);
  });

  it("exits with code 1 when gh CLI fails", () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("gh: not found");
    });
    const { mockExit, mockError } = exitThrows();

    expect(() => collectPRs(range, config)).toThrow(EXIT_ERROR);
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockError.mockRestore();
  });
});

describe("collectCommits", () => {
  it("maps commits and trims sha to 8 characters", () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(rawCommitLine as any)
      .mockReturnValue("" as any);

    const commits = collectCommits(range, config);

    expect(commits).toHaveLength(1);
    expect(commits[0]).toMatchObject({
      sha: "abc12345",
      message: "fix: resolve bug",
      repo: "repo",
      date: "2026-02-10T09:00:00Z",
    });
  });

  it("filters out merge commits", () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(`${rawCommitLine}\n${mergeCommitLine}` as any)
      .mockReturnValue("" as any);

    const commits = collectCommits(range, config);

    expect(commits).toHaveLength(1);
    expect(commits[0]?.message).toBe("fix: resolve bug");
  });

  it("stops paginating when page returns fewer than PER_PAGE results", () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(rawCommitLine as any)
      .mockReturnValue("" as any);

    collectCommits(range, config);

    // page 1: rawCommitLine (1 result < 100 → break)
    // page 2 never called → total = 1 call
    expect(execSync).toHaveBeenCalledTimes(1);
  });

  it("returns empty list when all commits are merge commits", () => {
    vi.mocked(execSync)
      .mockReturnValueOnce(mergeCommitLine as any)
      .mockReturnValue("" as any);

    expect(collectCommits(range, config)).toEqual([]);
  });

  it("exits with code 1 when gh CLI fails", () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("authentication failed");
    });
    const { mockExit, mockError } = exitThrows();

    expect(() => collectCommits(range, config)).toThrow(EXIT_ERROR);
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockError.mockRestore();
  });
});
