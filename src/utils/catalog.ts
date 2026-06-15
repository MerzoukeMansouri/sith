import { CATALOG_BASE_URL, SKILLS_CATALOG } from "../config.js";
import type {
	CatalogSkillEntry,
	OrgCatalog,
	SkillEntry,
	TeamCatalog,
} from "../types.js";

const FETCH_TIMEOUT_MS = 5000;

async function fetchJson<T>(url: string): Promise<T | null> {
	try {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		const res = await fetch(url, { signal: controller.signal });
		clearTimeout(timer);
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch {
		return null;
	}
}

export async function fetchOrgCatalog(): Promise<OrgCatalog | null> {
	return fetchJson<OrgCatalog>(`${CATALOG_BASE_URL}/org.json`);
}

export async function fetchTeamCatalog(
	team: string,
): Promise<TeamCatalog | null> {
	return fetchJson<TeamCatalog>(`${CATALOG_BASE_URL}/teams/${team}.json`);
}

export async function getEffectiveCatalog(team?: string): Promise<SkillEntry[]> {
	const [org, teamCatalog] = await Promise.all([
		fetchOrgCatalog(),
		team ? fetchTeamCatalog(team) : Promise.resolve(null),
	]);

	if (!org && !teamCatalog) return SKILLS_CATALOG;

	const forbiddenNames = new Set<string>(org?.forbidden ?? []);

	const merged = new Map<string, SkillEntry>();

	for (const skill of SKILLS_CATALOG) {
		if (!forbiddenNames.has(skill.name)) merged.set(skill.name, skill);
	}

	const applyRemote = (skills: CatalogSkillEntry[]) => {
		for (const skill of skills) {
			if (skill.scope === "forbidden") {
				forbiddenNames.add(skill.name);
				merged.delete(skill.name);
			} else if (!forbiddenNames.has(skill.name)) {
				merged.set(skill.name, skill);
			}
		}
	};

	if (org?.global) applyRemote(org.global);
	if (teamCatalog?.skills) applyRemote(teamCatalog.skills);

	return Array.from(merged.values());
}
