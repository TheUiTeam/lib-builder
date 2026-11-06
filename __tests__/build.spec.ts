import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "fs";
import { join } from "path";

import { afterEach, describe, expect, it } from "@jest/globals";

import {
  cleanProjects,
  makeProject,
  readJson,
  runCli,
} from "./helpers/fixture.ts";

const tsconfig = JSON.stringify({
  compilerOptions: { strict: true, lib: ["es2015", "dom"], types: [] },
});

// tsc keeps its own compile cache in the temp directory
const tempConfigs = (temp: string) =>
  readdirSync(temp).filter((name) => name.startsWith("tmp-"));

afterEach(cleanProjects);

describe("lib-builder build", () => {
  it("emits both targets and marks es2015 as ESM", () => {
    const project = makeProject({
      "tsconfig.json": tsconfig,
      "src/index.ts": "export const answer: number = 42;\n",
    });

    const { status, output } = runCli(project, "build");

    expect(output).not.toContain("error TS");
    expect(status).toBe(0);
    expect(existsSync(join(project, "dist/es5/index.js"))).toBe(true);
    expect(existsSync(join(project, "dist/es5/index.d.ts"))).toBe(true);
    expect(existsSync(join(project, "dist/es2015/index.js"))).toBe(true);

    expect(readJson(join(project, "dist/es2015/package.json"))).toEqual({
      type: "module",
    });
  });

  it("exits non-zero when the compiler reports an error", () => {
    const project = makeProject({
      "tsconfig.json": tsconfig,
      "src/index.ts": 'export const answer: number = "no";\n',
    });

    const { status, output } = runCli(project, "build");

    expect(output).toContain("TS2322");
    expect(status).toBe(1);
  });

  it.each([
    ["a passing", "export const answer: number = 42;\n"],
    ["a failing", 'export const answer: number = "no";\n'],
  ])("leaves no temporary config behind after %s build", (_, source) => {
    const project = makeProject({
      "tsconfig.json": tsconfig,
      "src/index.ts": source,
    });
    const temp = join(project, "temp");

    mkdirSync(temp);
    runCli(project, "build", { TMPDIR: temp });

    expect(tempConfigs(temp)).toEqual([]);
  });

  it("fails and cleans up when the compiler cannot start", () => {
    const project = makeProject(
      { "tsconfig.json": tsconfig, "src/index.ts": "export {};\n" },
      { linkModules: false },
    );
    const temp = join(project, "temp");
    const tsc = join(project, "node_modules/.bin/tsc");

    mkdirSync(temp);
    mkdirSync(join(project, "node_modules/.bin"), { recursive: true });
    writeFileSync(tsc, "not executable");
    chmodSync(tsc, 0o644);

    const { status } = runCli(project, "build", { TMPDIR: temp });

    expect(status).toBe(1);
    expect(tempConfigs(temp)).toEqual([]);
  });

  it("exits non-zero when no compiler can be found", () => {
    const project = makeProject(
      { "tsconfig.json": tsconfig, "src/index.ts": "export {};\n" },
      { linkModules: false },
    );

    const { status, output } = runCli(project, "build");

    expect(output).toContain("could not find command: [tsc]");
    expect(status).toBe(1);
  });
});
