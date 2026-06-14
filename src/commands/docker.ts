import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execa } from "execa";
import { DOCKER_CONFIG } from "../config.js";
import type { DockerCommandOptions } from "../types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find project root by looking for docker/ folder
function findProjectRoot(startDir: string): string {
	let currentDir = startDir;
	const rootPath = path.parse(currentDir).root;

	while (currentDir !== rootPath) {
		const dockerPath = path.join(currentDir, DOCKER_CONFIG.folderName);
		if (fs.existsSync(dockerPath) && fs.statSync(dockerPath).isDirectory()) {
			return currentDir;
		}
		currentDir = path.dirname(currentDir);
	}

	throw new Error(
		`Could not find project root (${DOCKER_CONFIG.folderName}/ folder not found)`,
	);
}

const rootDir = findProjectRoot(__dirname);

export async function dockerCommand(
	options: DockerCommandOptions,
): Promise<void> {
	if (options.build) {
		await buildDocker();
		return;
	}

	if (options.pull) {
		await pullDocker();
		return;
	}
}

async function pullDocker(): Promise<void> {
	console.log("📦 Pulling prebuilt Docker image...");
	console.log();

	try {
		console.log(`Source: ${DOCKER_CONFIG.prebuiltImage}`);
		console.log(`Target: ${DOCKER_CONFIG.imageName}`);
		console.log();

		await execa("docker", ["pull", DOCKER_CONFIG.prebuiltImage], {
			stdio: "inherit",
		});

		console.log();
		console.log("🏷️  Tagging image for local use...");

		await execa(
			"docker",
			["tag", DOCKER_CONFIG.prebuiltImage, DOCKER_CONFIG.imageName],
			{
				stdio: "inherit",
			},
		);

		console.log();
		console.log("✅ Docker image ready!");
		console.log(`Image: ${DOCKER_CONFIG.imageName}`);
		console.log();
		console.log("Run: sith --it");
	} catch (error) {
		console.error("❌ Pull failed");
		if (error instanceof Error) {
			console.error(error.message);
		}
		process.exit(1);
	}
}

async function buildDocker(): Promise<void> {
	console.log("🔨 Building Docker image from scratch...");
	console.log();

	try {
		const dockerfilePath = path.join(
			rootDir,
			DOCKER_CONFIG.folderName,
			DOCKER_CONFIG.dockerfileName,
		);

		if (!fs.existsSync(dockerfilePath)) {
			throw new Error(`Dockerfile not found at: ${dockerfilePath}`);
		}

		console.log(`Root: ${rootDir}`);
		console.log(`Dockerfile: ${dockerfilePath}`);
		console.log();

		await execa(
			"docker",
			["build", "-f", dockerfilePath, "-t", DOCKER_CONFIG.imageName, rootDir],
			{
				stdio: "inherit",
			},
		);

		console.log();
		console.log("✅ Docker image built successfully!");
		console.log(`Image: ${DOCKER_CONFIG.imageName}`);
		console.log();
		console.log("Run: sith --it");
	} catch (error) {
		console.error("❌ Build failed");
		if (error instanceof Error) {
			console.error(error.message);
		}
		process.exit(1);
	}
}
