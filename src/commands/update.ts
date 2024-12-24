import { green } from "../utils/log.ts";
import { spawn } from "../utils/spawn.ts";

export const update = async () => {
  green("Updating lib-builder 🌯");

  await spawn("yarn", ["add", "--dev", "@theuiteam/lib-builder"]);
};
