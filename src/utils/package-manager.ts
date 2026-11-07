import { existsSync, readFileSync } from "fs";
import { join } from "path";

const managers = {
  npm: {
    addDev: ["install", "--save-dev"],
    run: "npm run",
    exec: "npx",
    install: "npm ci",
  },
  pnpm: {
    addDev: ["add", "--save-dev"],
    run: "pnpm run",
    exec: "pnpm exec",
    install: "pnpm install --frozen-lockfile",
  },
  yarn: {
    addDev: ["add", "--dev"],
    run: "yarn",
    exec: "yarn",
    install: "yarn install --frozen-lockfile",
  },
} as const;

type ManagerName = keyof typeof managers;

export type PackageManager = (typeof managers)[ManagerName] & {
  name: ManagerName;
  source: "declared" | "lockfile" | "default";
};

export const DEFAULT_PACKAGE_MANAGER = "yarn@1.22.19";

const lockfiles: Record<string, ManagerName> = {
  "package-lock.json": "npm",
  "pnpm-lock.yaml": "pnpm",
  "yarn.lock": "yarn",
};

const declaredManager = (cwd: string): ManagerName | undefined => {
  const manifest = join(cwd, "package.json");

  if (!existsSync(manifest)) {
    return undefined;
  }

  const { packageManager = "" } = JSON.parse(readFileSync(manifest, "utf8"));
  const [name] = packageManager.split("@");

  if (packageManager && !(name in managers)) {
    throw new Error(`lib-builder cannot work with ${packageManager}`);
  }

  return packageManager ? (name as ManagerName) : undefined;
};

const lockedManager = (cwd: string): ManagerName | undefined => {
  const lockfile = Object.keys(lockfiles).find((file) =>
    existsSync(join(cwd, file)),
  );

  return lockfile ? lockfiles[lockfile] : undefined;
};

/**
 * The one answer to which manager a project uses: what `packageManager`
 * declares, else what a lockfile shows, else yarn.
 */
export const detectPackageManager = (cwd: string): PackageManager => {
  const declared = declaredManager(cwd);
  const locked = lockedManager(cwd);

  if (declared) {
    return { ...managers[declared], name: declared, source: "declared" };
  }

  return locked
    ? { ...managers[locked], name: locked, source: "lockfile" }
    : { ...managers.yarn, name: "yarn", source: "default" };
};

export const addDevCommand = (cwd: string, dependency: string) => {
  const { name, addDev } = detectPackageManager(cwd);

  return { manager: name, args: [...addDev, dependency] };
};

// pnpm/action-setup fails on a `version` that differs from a declared one, and
// on no version at all, so it gets one only when nothing declares it.
const pnpmSetup = ({ name, source }: PackageManager) => {
  if (name !== "pnpm") {
    return "";
  }

  const step = "      - uses: pnpm/action-setup@v6\n";

  return source === "declared"
    ? step
    : `${step}        with:\n          version: latest\n`;
};

/** Writes a static file's placeholders out in the project's manager. */
export const fillManagerTemplate = (
  template: string,
  manager: PackageManager,
) =>
  template
    .replace(/^ *# __PNPM_SETUP__\n/m, pnpmSetup(manager))
    .replace(/__MANAGER__/g, manager.name)
    .replace(/__INSTALL__/g, manager.install)
    .replace(/__RUN__/g, manager.run)
    .replace(/__EXEC__/g, manager.exec);
