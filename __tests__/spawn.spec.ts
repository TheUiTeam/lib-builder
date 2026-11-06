import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { spawn } from "../src/utils/spawn.ts";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("spawn", () => {
  it("prints the child's output as text", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => undefined);

    await spawn(process.execPath, ["-e", 'process.stdout.write("hello")']);

    expect(log).toHaveBeenCalledWith("hello");
  });

  it("rejects with an error naming the failed command", async () => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);

    await expect(
      spawn(process.execPath, ["-e", "process.exit(3)"]),
    ).rejects.toThrow("exited with code 3");
  });

  it("rejects when the command cannot start", async () => {
    await expect(spawn("lib-builder-no-such-binary", [])).rejects.toThrow(
      "ENOENT",
    );
  });
});
