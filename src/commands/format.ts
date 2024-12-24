import { green } from "../utils/log.ts";
import { binPath } from "../utils/path.ts";
import { spawn } from "../utils/spawn.ts";

export const format = async () => {
  green("Running Prettier 🥑");

  const prettier = binPath("prettier");

  await spawn(prettier, ["src/**/*.+(ts|tsx)", "--write"]);
};
