import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

const { execa } = await import("execa");
const { getGitHubToken } = await import("../githubToken.js");

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.GITHUB_TOKEN;
});

afterEach(() => {
  delete process.env.GITHUB_TOKEN;
});

describe("getGitHubToken", () => {
  it("returns env var when set", async () => {
    process.env.GITHUB_TOKEN = "env-token-abc";
    const token = await getGitHubToken();
    expect(token).toBe("env-token-abc");
    expect(execa).not.toHaveBeenCalled();
  });

  it("calls gh auth token when env var missing", async () => {
    vi.mocked(execa).mockResolvedValue({ stdout: "  gh-token-xyz  " } as never);
    const token = await getGitHubToken();
    expect(execa).toHaveBeenCalledWith("gh", ["auth", "token"]);
    expect(token).toBe("gh-token-xyz");
  });

  it("returns empty string when gh CLI fails", async () => {
    vi.mocked(execa).mockRejectedValue(new Error("gh not found"));
    const token = await getGitHubToken();
    expect(token).toBe("");
  });

  it("env var takes precedence over gh CLI", async () => {
    process.env.GITHUB_TOKEN = "env-wins";
    vi.mocked(execa).mockResolvedValue({ stdout: "gh-token" } as never);
    const token = await getGitHubToken();
    expect(token).toBe("env-wins");
    expect(execa).not.toHaveBeenCalled();
  });
});
