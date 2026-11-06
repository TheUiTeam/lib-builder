import { green } from "../utils/log.ts";
import { addDevCommand } from "../utils/package-manager.ts";
import { spawn } from "../utils/spawn.ts";

export const update = async () => {
  green("Updating lib-builder 🌯");

  const { manager, args } = addDevCommand(
    process.cwd(),
    "@theuiteam/lib-builder",
  );

  await spawn(manager, args);
};
