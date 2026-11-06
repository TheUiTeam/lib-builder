import { spawnSync } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

import { afterEach, describe, expect, it } from "@jest/globals";

import {
  cleanProjects,
  makeProject,
  readJson,
  runCli,
} from "./helpers/fixture.ts";

const version = readJson(join(__dirname, "../package.json")).version;

afterEach(cleanProjects);

describe("lib-builder init", () => {
  it("sets up a new project", () => {
    const project = makeProject(
      { "package.json": '{"name":"fresh","version":"1.0.0"}' },
      { linkModules: false },
    );

    const { status, output } = runCli(project, "init");
    const pkg = readJson(join(project, "package.json"));

    expect(output).toContain("Project created");
    expect(status).toBe(0);
    expect(pkg.main).toBe("dist/es5/index.js");
    expect(pkg.module).toBe("dist/es2015/index.js");
    expect(pkg.scripts.build).toContain("lib-builder build");
    expect(pkg.devDependencies["@theuiteam/lib-builder"]).toBe(`^${version}`);
    expect(existsSync(join(project, "tsconfig.json"))).toBe(true);
    expect(existsSync(join(project, "src/index.ts"))).toBe(true);
    expect(existsSync(join(project, ".husky/pre-commit"))).toBe(true);
    expect(existsSync(join(project, "static"))).toBe(false);
    expect(existsSync(join(project, ".github/workflows/ci.yml"))).toBe(true);
    expect(existsSync(join(project, ".travis.yml"))).toBe(false);
  });

  it("sets up tests that import a source by its .ts name", () => {
    const project = makeProject({
      "package.json": '{"name":"fresh","version":"1.0.0"}',
      "__tests__/extension.spec.ts":
        "import '../src/index.ts';\n\ntest('loads', () => {});\n",
    });

    runCli(project, "init");

    const { status, stderr } = spawnSync(
      join(project, "node_modules/.bin/jest"),
      ["__tests__/extension.spec.ts"],
      { cwd: project, encoding: "utf8" },
    );

    expect(stderr).toContain("1 passed");
    expect(status).toBe(0);
  });

  it("keeps what the project already declares and the files it already has", () => {
    const project = makeProject(
      {
        "package.json": JSON.stringify({
          name: "existing",
          main: "lib/index.js",
          types: "lib/index.d.ts",
          engines: { node: ">=22" },
          files: ["lib"],
          prettier: { semi: false },
          packageManager: "pnpm@10.0.0",
          scripts: { test: "vitest", build: "rollup -c", custom: "echo hi" },
        }),
        "src/index.ts": "export const mine = 1;\n",
      },
      { linkModules: false },
    );

    const { status } = runCli(project, "init");
    const pkg = readJson(join(project, "package.json"));

    expect(status).toBe(0);
    expect(pkg.main).toBe("lib/index.js");
    expect(pkg.types).toBe("lib/index.d.ts");
    expect(pkg.engines).toEqual({ node: ">=22" });
    expect(pkg.files).toEqual(["lib"]);
    expect(pkg.prettier).toEqual({ semi: false });
    expect(pkg.packageManager).toBe("pnpm@10.0.0");
    expect(pkg.scripts.test).toBe("vitest");
    expect(pkg.scripts.build).toBe("rollup -c");
    expect(pkg.scripts.custom).toBe("echo hi");
    expect(pkg.scripts.lint).toBe("lib-builder lint");

    expect(readFileSync(join(project, "src/index.ts"), "utf8")).toBe(
      "export const mine = 1;\n",
    );
  });

  it("can run twice and changes nothing the second time", () => {
    const project = makeProject(
      { "package.json": '{"name":"twice","version":"1.0.0"}' },
      { linkModules: false },
    );

    runCli(project, "init");

    const first = readFileSync(join(project, "package.json"), "utf8");
    const { status, output } = runCli(project, "init");

    expect(output).toContain("Project created");
    expect(status).toBe(0);
    expect(readFileSync(join(project, "package.json"), "utf8")).toBe(first);
  });

  it("exits non-zero and copies nothing without a package.json", () => {
    const project = makeProject({});

    const { status } = runCli(project, "init");

    expect(status).toBe(1);
    expect(existsSync(join(project, "tsconfig.json"))).toBe(false);
  });
});
