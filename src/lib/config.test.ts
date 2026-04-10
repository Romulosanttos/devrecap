import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";

vi.mock("node:fs");

describe("loadConfig", () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.GH_USER;
    delete process.env.GH_ORG;
    vi.mocked(existsSync).mockReturnValue(false);
  });

  it("returns config when env vars are already set", async () => {
    process.env.GH_USER = "john";
    process.env.GH_ORG = "acme";

    const { loadConfig } = await import("./config.js");
    expect(loadConfig()).toEqual({ ghUser: "john", ghOrg: "acme" });
  });

  it("loads GH_USER and GH_ORG from .env file", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("GH_USER=fromfile\nGH_ORG=myorg\n");

    const { loadConfig } = await import("./config.js");
    expect(loadConfig()).toEqual({ ghUser: "fromfile", ghOrg: "myorg" });
  });

  it("strips surrounding quotes from values in .env", async () => {
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("GH_USER=\"quoted\"\nGH_ORG='singlequote'\n");

    const { loadConfig } = await import("./config.js");
    expect(loadConfig()).toEqual({ ghUser: "quoted", ghOrg: "singlequote" });
  });

  it("does not override env vars already set when .env also has them", async () => {
    process.env.GH_USER = "existing";

    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readFileSync).mockReturnValue("GH_USER=fromfile\nGH_ORG=myorg\n");

    const { loadConfig } = await import("./config.js");
    const result = loadConfig();
    expect(result.ghUser).toBe("existing");
    expect(result.ghOrg).toBe("myorg");
  });

  it("exits with code 1 when env vars are missing and no .env", async () => {
    const mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit(1)");
    });
    const mockError = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const { loadConfig } = await import("./config.js");
    expect(() => loadConfig()).toThrow("process.exit(1)");
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockError.mockRestore();
  });
});
