import { existsSync, readFileSync } from "fs";
import { join } from "path";

const addDev = {
  npm: ["install", "--save-dev"],
  pnpm: ["add", "--save-dev"],
  yarn: ["add", "--dev"],
} as const;

type PackageManager = keyof typeof addDev;

const lockfiles: Record<string, PackageManager> = {
  "package-lock.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
};

const declaredManager = (cwd: string): PackageManager | undefined => {
  const manifest = join(cwd, "package.json");

  if (!existsSync(manifest)) {
    return undefined;
  }

  const { packageManager = "" } = JSON.parse(readFileSync(manifest, "utf8"));
  const [name] = packageManager.split("@");

  return name in addDev ? (name as PackageManager) : undefined;
};

const lockedManager = (cwd: string): PackageManager | undefined => {
  const lockfile = Object.keys(lockfiles).find((file) =>
    existsSync(join(cwd, file)),
  );

  return lockfile ? lockfiles[lockfile] : undefined;
};

export const addDevCommand = (cwd: string, dependency: string) => {
  const manager = declaredManager(cwd) ?? lockedManager(cwd) ?? "yarn";

  return { manager, args: [...addDev[manager], dependency] };
};
