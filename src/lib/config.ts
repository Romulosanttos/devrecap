import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Config } from "../types.js";

export const ROOT = resolve(import.meta.dirname, "../..");

function loadEnv(): void {
  const envFile = resolve(ROOT, ".env");
  if (!existsSync(envFile)) return;

  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
    }
  }
}

export function loadConfig(): Config {
  loadEnv();

  const ghUser = process.env.GH_USER;
  const ghOrg = process.env.GH_ORG;

  if (!ghUser || !ghOrg) {
    console.error("Error: missing required environment variables.\n");
    console.error("Copy .env.example to .env and set the required values:");
    console.error("  GH_USER=your-github-username");
    console.error("  GH_ORG=your-github-org  (use your username for personal repos)\n");
    console.error("Then run: npm run collect -- Q{n}-{year}");
    process.exit(1);
  }

  return { ghUser, ghOrg };
}
