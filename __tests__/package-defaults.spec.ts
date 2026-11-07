import { describe, expect, it } from "@jest/globals";

import { mergePackage } from "../src/utils/package-defaults.ts";
import { detectPackageManager } from "../src/utils/package-manager.ts";

const manager = detectPackageManager("/nowhere");

describe("mergePackage", () => {
  it("replaces what npm init writes as a placeholder", () => {
    const pkg = mergePackage(
      {
        main: "index.js",
        scripts: { test: 'echo "Error: no test specified" && exit 1' },
      },
      "1.1.0",
      manager,
    );

    expect(pkg.main).toBe("dist/es5/index.js");
    expect((pkg.scripts as Record<string, string>).test).toBe("jest");
  });

  it("declares only what the builder produces", () => {
    const pkg = mergePackage({}, "1.1.0", manager);

    expect(pkg).not.toHaveProperty(["module:es2019"]);
    expect(pkg).not.toHaveProperty("engines");
    expect(pkg.scripts).not.toHaveProperty("dev");
  });

  it("accepts every supported React in the generated peer range", () => {
    const pkg = mergePackage({}, "1.1.0", manager);

    expect((pkg.peerDependencies as Record<string, string>).react).toContain(
      "^19.0.0",
    );
  });

  it("depends on the builder that ran it", () => {
    const pkg = mergePackage({}, "2.3.4", manager);

    expect(
      (pkg.devDependencies as Record<string, string>)["@theuiteam/lib-builder"],
    ).toBe("^2.3.4");
  });
});
