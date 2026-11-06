import { spawn as nativeSpawn, SpawnOptions } from "child_process";

import { red, white } from "./log.ts";

export const spawn = (
  command: string,
  args: string[],
  options?: SpawnOptions,
) =>
  new Promise<void>((resolve, reject) => {
    const child = nativeSpawn(command, args, {
      ...options,
      env: { ...process.env, FORCE_COLOR: "true" },
    });

    child.stdout?.on("data", (chunk: Buffer) => white(chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => red(chunk.toString()));

    child.on("error", reject);

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
