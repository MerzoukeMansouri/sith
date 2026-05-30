import { execa } from "execa";

export async function getGitHubToken(): Promise<string> {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const { stdout } = await execa("gh", ["auth", "token"]);
    return stdout.trim();
  } catch {
    return "";
  }
}
