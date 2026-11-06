import { spawnSync } from "child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { dirname, join, resolve } from "path";

const root = resolve(__dirname, "../..");
const bin = join(root, "bin/lib-builder");

const created: string[] = [];

export const makeProject = (
  files: Record<string, string>,
  { linkModules = true } = {},
): string => {
  const dir = mkdtempSync(join(realpathSync(tmpdir()), "lib-builder-test-"));

  created.push(dir);

  if (linkModules) {
    symlinkSync(join(root, "node_modules"), join(dir, "node_modules"));
  }

  Object.entries(files).forEach(([file, content]) => {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), content);
  });

  return dir;
};

export const cleanProjects = () => {
  created
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true }));
};

export const runCli = (
  cwd: string,
  command: string,
  env: Record<string, string> = {},
) => {
  if (!existsSync(join(root, "dist/cli.js"))) {
    throw new Error("dist/cli.js is missing: run `yarn build` first");
  }

  const result = spawnSync(process.execPath, [bin, command], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });

  return {
    status: result.status,
    output: `${result.stdout}${result.stderr}`,
  };
};

export const readJson = (file: string) =>
  JSON.parse(readFileSync(file, "utf8"));
