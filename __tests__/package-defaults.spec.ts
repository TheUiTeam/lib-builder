import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, it } from "@jest/globals";

import { mergePackage } from "../src/utils/package-defaults.ts";
import { detectPackageManager } from "../src/utils/package-manager.ts";

const manager = detectPackageManager("/nowhere");
const root = join(__dirname, "..");
const builder = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const at = (version: string) => ({ ...builder, version });

describe("mergePackage", () => {
  it("replaces what npm init writes as a placeholder", () => {
    const pkg = mergePackage(
      {
        main: "index.js",
        scripts: { test: 'echo "Error: no test specified" && exit 1' },
      },
      at("1.1.0"),
      manager,
    );

    expect(pkg.main).toBe("dist/es5/index.js");
    expect((pkg.scripts as Record<string, string>).test).toBe("jest");
  });

  it("declares only what the builder produces", () => {
    const pkg = mergePackage({}, at("1.1.0"), manager);

    expect(pkg).not.toHaveProperty(["module:es2019"]);
    expect(pkg).not.toHaveProperty("engines");
    expect(pkg.scripts).not.toHaveProperty("dev");
  });

  it("accepts every supported React in the generated peer range", () => {
    const pkg = mergePackage({}, at("1.1.0"), manager);

    expect((pkg.peerDependencies as Record<string, string>).react).toContain(
      "^19.0.0",
    );
  });

  it("depends on the builder that ran it", () => {
    const pkg = mergePackage({}, at("2.3.4"), manager);

    expect(
      (pkg.devDependencies as Record<string, string>)["@theuiteam/lib-builder"],
    ).toBe("^2.3.4");
  });

  // a strict linker such as pnpm links only what the project declares, so
  // nothing the generated files call or load may come through the builder
  describe("declares, at the builder's own range, what the generated files use", () => {
    const pkg = mergePackage({}, builder, manager);
    const declared = pkg.devDependencies as Record<string, string>;
    const ranges = { ...builder.devDependencies, ...builder.dependencies };
    const staticFile = (file: string) =>
      readFileSync(join(root, "static", file), "utf8");

    it.each([
      // scripts, the lint-staged commands and the pre-commit hook
      "jest",
      "size-limit",
      "husky",
      "lint-staged",
      "conventional-changelog-cli",
      "prettier",
      "eslint",
      // jest.config.js's preset, and the compiler it runs
      "ts-jest",
      "typescript",
      // tsconfig.json's types
      "@types/node",
      "@types/jest",
      // eslint.config.mjs's typescript resolver
      "eslint-import-resolver-typescript",
    ])("%s", (name) => {
      expect(declared[name]).toBe(ranges[name]);
    });

    it("every package eslint.config.mjs imports", () => {
      const imported = [
        ...staticFile("eslint.config.mjs").matchAll(
          /^import .* from '(.+)';$/gm,
        ),
      ].map(([, name]) => name);

      expect(imported.length).toBeGreaterThan(0);

      imported.forEach((name) =>
        expect([name, declared[name]]).toEqual([name, ranges[name]]),
      );
    });

    it("the size-limit preset .size-limit.js needs", () => {
      expect(declared["@size-limit/preset-small-lib"]).toBe(
        ranges["@size-limit/preset-small-lib"],
      );
    });
  });
});
