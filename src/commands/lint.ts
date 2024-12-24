import { green } from "../utils/log.ts";
import { binPath } from "../utils/path.ts";
import { spawn } from "../utils/spawn.ts";

export const lint = async () => {
  const tslint = binPath("eslint");

  green("Running Eslint 🌯");

  await spawn(tslint, [
    "--format",
    "stylish",
    "./+(src|__tests__)/**/*.+(ts|tsx)",
  ]);
};
