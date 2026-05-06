import * as path from "node:path";

function resolveProjectRoot() {
	const currentWorkingDirectory = process.cwd();

	if (path.basename(currentWorkingDirectory) === "backend") {
		return path.dirname(currentWorkingDirectory);
	}

	return currentWorkingDirectory;
}

export const PROJECT_ROOT = resolveProjectRoot();
export const STORAGE_ROOT = path.join(PROJECT_ROOT, "storage", "documents");
