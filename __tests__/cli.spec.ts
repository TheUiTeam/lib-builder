import { afterEach, describe, expect, it } from "@jest/globals";

import { cleanProjects, makeProject, runCli } from "./helpers/fixture.ts";

afterEach(cleanProjects);

describe("lib-builder", () => {
  it("refuses an unknown command", () => {
    const { status, output } = runCli(makeProject({}), "nonsense");

    expect(output).toContain("invalid command name nonsense");
    expect(status).toBe(1);
  });

  it("prints what the tool reports and exits non-zero when it fails", () => {
    const project = makeProject({
      "eslint.config.mjs":
        'export default [{ files: ["**/*.ts"], rules: { "no-debugger": "error" } }];\n',
      "src/index.ts": "debugger;\n",
    });

    const { status, output } = runCli(project, "lint");

    expect(output).toContain("no-debugger");
    expect(output).not.toContain("<Buffer");
    expect(status).toBe(1);
  });
});
