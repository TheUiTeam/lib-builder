import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import { delimiter, join } from "path";

import { afterEach, describe, expect, it } from "@jest/globals";

import { cleanProjects, makeProject, runCli } from "./helpers/fixture.ts";

afterEach(cleanProjects);

const fakeManagers = (project: string) => {
  const bin = join(project, "fake-bin");

  mkdirSync(bin);

  ["npm", "pnpm", "yarn"].forEach((manager) => {
    const file = join(bin, manager);

    writeFileSync(
      file,
      `#!/bin/sh\necho "${manager} $@" > "${join(project, "ran.txt")}"\n`,
    );

    chmodSync(file, 0o755);
  });

  return { PATH: `${bin}${delimiter}${process.env.PATH}` };
};

const update = (files: Record<string, string>, { initFirst = false } = {}) => {
  const project = makeProject(files, { linkModules: false });

  if (initFirst) {
    runCli(project, "init");
  }

  const { status } = runCli(project, "update", fakeManagers(project));

  expect(status).toBe(0);

  return readFileSync(join(project, "ran.txt"), "utf8").trim();
};

const manifest = (packageManager: string) =>
  JSON.stringify({ name: "fixture", packageManager });

describe("lib-builder update", () => {
  it.each([
    ["npm@11.19.0", "npm install --save-dev @theuiteam/lib-builder"],
    ["pnpm@12.18.0", "pnpm add --save-dev @theuiteam/lib-builder"],
    ["yarn@1.22.22", "yarn add --dev @theuiteam/lib-builder"],
  ])("runs the manager %s names", (packageManager, command) => {
    expect(update({ "package.json": manifest(packageManager) })).toBe(command);
  });

  it.each([
    ["package-lock.json", "npm install --save-dev @theuiteam/lib-builder"],
    ["pnpm-lock.yaml", "pnpm add --save-dev @theuiteam/lib-builder"],
    ["yarn.lock", "yarn add --dev @theuiteam/lib-builder"],
  ])("falls back to the manager that owns %s", (lockfile, command) => {
    expect(update({ "package.json": "{}", [lockfile]: "" })).toBe(command);
  });

  it.each([
    ["package-lock.json", "npm install --save-dev @theuiteam/lib-builder"],
    ["pnpm-lock.yaml", "pnpm add --save-dev @theuiteam/lib-builder"],
    ["yarn.lock", "yarn add --dev @theuiteam/lib-builder"],
  ])("picks the same manager for %s after init", (lockfile, command) => {
    expect(
      update({ "package.json": "{}", [lockfile]: "" }, { initFirst: true }),
    ).toBe(command);
  });

  it("refuses a manager it cannot run rather than run another", () => {
    const project = makeProject(
      { "package.json": manifest("bun@1.3.0") },
      { linkModules: false },
    );

    const { status, output } = runCli(project, "update", fakeManagers(project));

    expect(status).toBe(1);
    expect(output).toContain("bun@1.3.0");
    expect(existsSync(join(project, "ran.txt"))).toBe(false);
  });

  it("stays on yarn when nothing names a manager", () => {
    expect(update({ "package.json": "{}" })).toBe(
      "yarn add --dev @theuiteam/lib-builder",
    );
  });
});
