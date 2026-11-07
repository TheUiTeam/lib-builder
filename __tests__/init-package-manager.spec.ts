import { spawnSync } from "child_process";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

import { afterEach, describe, expect, it } from "@jest/globals";

import {
  cleanProjects,
  makeProject,
  readJson,
  runCli,
} from "./helpers/fixture.ts";

afterEach(cleanProjects);

const init = (files: Record<string, string>) => {
  const project = makeProject(files, { linkModules: false });
  const { status, output } = runCli(project, "init");

  expect(output).toContain("Project created");
  expect(status).toBe(0);

  return {
    project,
    pkg: readJson(join(project, "package.json")),
    workflow: readFileSync(join(project, ".github/workflows/ci.yml"), "utf8"),
    hook: readFileSync(join(project, ".husky/pre-commit"), "utf8"),
  };
};

const manifest = (packageManager?: string) =>
  JSON.stringify({ name: "fixture", version: "1.0.0", packageManager });

const generated = {
  npm: {
    run: "npm run",
    install: "npm ci",
    hook: "npx lint-staged\n",
  },
  pnpm: {
    run: "pnpm run",
    install: "pnpm install --frozen-lockfile",
    hook: "pnpm exec lint-staged\n",
  },
  yarn: {
    run: "yarn",
    install: "yarn install --frozen-lockfile",
    hook: "yarn lint-staged\n",
  },
};

type Manager = keyof typeof generated;

const expectGeneratedFor = (
  manager: Manager,
  { pkg, workflow, hook }: ReturnType<typeof init>,
) => {
  const { run, install, hook: expectedHook } = generated[manager];

  expect(pkg.scripts.build).toBe(`lib-builder build && ${run} size:report`);
  expect(pkg.scripts.release).toBe(`${run} build && ${run} test`);
  expect(pkg.scripts.prepack).toBe(`${run} build && ${run} changelog`);
  expect(hook).toBe(expectedHook);
  expect(workflow).toContain(`cache: ${manager}\n`);
  expect(workflow).toContain(`- run: ${install}\n`);
  expect(workflow).toContain(`- run: ${run} test:ci\n`);
  expect(workflow).not.toContain("__");

  Object.keys(generated)
    .filter((other) => other !== manager)
    .forEach((other) => {
      const command = new RegExp(
        `\\b${other} (run|ci|install|exec|test|build)`,
      );

      expect(JSON.stringify(pkg.scripts)).not.toMatch(command);
      expect(workflow).not.toMatch(command);
    });
};

describe("lib-builder init picks the project's package manager", () => {
  it.each<[Manager, string]>([
    ["npm", "package-lock.json"],
    ["pnpm", "pnpm-lock.yaml"],
    ["yarn", "yarn.lock"],
  ])("keeps %s when only %s shows it", (manager, lockfile) => {
    const result = init({ "package.json": manifest(), [lockfile]: "" });

    expect(result.pkg).not.toHaveProperty("packageManager");
    expectGeneratedFor(manager, result);
  });

  it.each<[Manager, string]>([
    ["npm", "npm@11.19.0"],
    ["pnpm", "pnpm@12.18.0"],
    ["yarn", "yarn@1.22.22"],
  ])("keeps %s when %s is declared", (manager, packageManager) => {
    const result = init({ "package.json": manifest(packageManager) });

    expect(result.pkg.packageManager).toBe(packageManager);
    expectGeneratedFor(manager, result);
  });

  it("believes the declared manager over a lockfile", () => {
    const result = init({
      "package.json": manifest("pnpm@12.18.0"),
      "yarn.lock": "",
    });

    expect(result.pkg.packageManager).toBe("pnpm@12.18.0");
    expectGeneratedFor("pnpm", result);
  });

  it("declares yarn in a project nothing names a manager for", () => {
    const result = init({ "package.json": manifest() });

    expect(result.pkg.packageManager).toBe("yarn@1.22.19");
    expectGeneratedFor("yarn", result);
  });

  it("refuses a manager it cannot generate for, and changes nothing", () => {
    const original = manifest("bun@1.3.0");
    const project = makeProject(
      { "package.json": original, "yarn.lock": "" },
      { linkModules: false },
    );

    const { status, output } = runCli(project, "init");

    expect(status).toBe(1);
    expect(output).toContain("bun@1.3.0");
    expect(readFileSync(join(project, "package.json"), "utf8")).toBe(original);
  });

  it("leaves a workflow and a hook the project already has", () => {
    const { workflow, hook } = init({
      "package.json": manifest(),
      "pnpm-lock.yaml": "",
      ".github/workflows/ci.yml": "name: mine\n",
      ".husky/pre-commit": "mine\n",
    });

    expect(workflow).toBe("name: mine\n");
    expect(hook).toBe("mine\n");
  });
});

describe("the generated workflow", () => {
  const stepOf = (workflow: string, text: string) => {
    const index = workflow.indexOf(text);

    expect(index).toBeGreaterThan(-1);

    return index;
  };

  it("sets pnpm up before setup-node, which needs it for the cache", () => {
    const { workflow } = init({ "package.json": manifest("pnpm@12.18.0") });

    expect(stepOf(workflow, "pnpm/action-setup@v6")).toBeLessThan(
      stepOf(workflow, "actions/setup-node"),
    );
  });

  // the action refuses a `version` beside a different declared one, and
  // refuses to run with neither
  it("leaves the pnpm version to packageManager when it is declared", () => {
    const { workflow } = init({ "package.json": manifest("pnpm@12.18.0") });

    expect(workflow).toContain(
      "- uses: pnpm/action-setup@v6\n      - uses: actions/setup-node",
    );
  });

  it("gives pnpm a version when nothing declares one", () => {
    const { workflow } = init({
      "package.json": manifest(),
      "pnpm-lock.yaml": "",
    });

    expect(workflow).toContain(
      "- uses: pnpm/action-setup@v6\n        with:\n          version: latest\n",
    );
  });

  it.each(["npm@11.19.0", "yarn@1.22.22"])(
    "sets no pnpm up for %s",
    (packageManager) => {
      const { workflow } = init({ "package.json": manifest(packageManager) });

      expect(workflow).not.toContain("pnpm");
    },
  );

  it("builds the library before it tests it", () => {
    const { workflow } = init({ "package.json": manifest("npm@11.19.0") });

    expect(stepOf(workflow, "- run: npm run build\n")).toBeLessThan(
      stepOf(workflow, "- run: npm run test:ci\n"),
    );
  });

  describe("entry point check", () => {
    const script = (workflow: string) => {
      const [, block] =
        /name: Check the packed entry points\n\s+run: \|\n([\s\S]*)$/.exec(
          workflow,
        ) ?? [];

      expect(block).toBeDefined();

      return block;
    };

    const check = (built: string[]) => {
      const { project, workflow } = init({
        "package.json": manifest("npm@11.19.0"),
      });

      built.forEach((file) => {
        mkdirSync(join(project, file, ".."), { recursive: true });
        writeFileSync(join(project, file), "");
      });

      return spawnSync("bash", ["-e", "-c", script(workflow)], {
        cwd: project,
        encoding: "utf8",
      });
    };

    it("passes when the package holds every entry point", () => {
      const { status } = check([
        "dist/es5/index.js",
        "dist/es5/index.d.ts",
        "dist/es2015/index.js",
      ]);

      expect(status).toBe(0);
    });

    it("fails and names the entry point the package lacks", () => {
      const { status, stderr } = check([
        "dist/es5/index.js",
        "dist/es5/index.d.ts",
      ]);

      expect(status).not.toBe(0);
      expect(stderr).toContain("dist/es2015/index.js");
    });
  });
});
