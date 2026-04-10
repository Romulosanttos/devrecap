#!/usr/bin/env tsx
/**
 * CLI entry point — collects PRs and commits from GitHub via the gh CLI
 * and saves them to data/github/{period}.json
 *
 * Configuration:
 *   Copy .env.example to .env and set GH_USER and GH_ORG before running.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { loadConfig, ROOT } from "./lib/config.js";
import { parsePeriod } from "./lib/period.js";
import { collectPRs, collectCommits } from "./lib/github.js";
import type { GitHubData } from "./types.js";

const program = new Command();

program
  .name("collect-github")
  .description("Collect GitHub PRs and commits for a given period")
  .argument("<period>", "Quarter label (e.g. Q2-2026) or a custom sprint name")
  .option("--start <date>", "Start date in YYYY-MM-DD format (required for custom labels)")
  .option("--end <date>", "End date in YYYY-MM-DD format (required for custom labels)")
  .parse();

const [label] = program.args as [string];
const { start, end } = program.opts<{ start?: string; end?: string }>();

const config = loadConfig();
const range = parsePeriod(label, { start, end });

console.log(`\nCollecting GitHub data for ${range.label} (${range.start} → ${range.end})`);
console.log(`User: ${config.ghUser} | Org: ${config.ghOrg}\n`);

const prs = collectPRs(range, config);
const commits = collectCommits(range, config);

const data: GitHubData = {
  period: range.label,
  collectedAt: new Date().toISOString(),
  author: config.ghUser,
  org: config.ghOrg,
  prs,
  commits,
};

const outDir = resolve(ROOT, "data/github");
mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, `${range.label}.json`);
writeFileSync(outFile, JSON.stringify(data, null, 2));

const repos = [...new Set(prs.map((p) => p.repo))];
console.log("Results:");
console.log(`  PRs merged: ${prs.length}`);
console.log(`  Commits:    ${commits.length}`);
console.log(`  Repos:      ${repos.join(", ") || "(none)"}`);
console.log(`\nSaved to: data/github/${range.label}.json`);
