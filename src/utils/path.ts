import { existsSync } from "fs";
import { resolve } from "path";

const findBin = (from: string, binName: string): string | undefined => {
  let path = from;

  while (path) {
    const file = resolve(path, "node_modules", ".bin", binName);

    if (existsSync(file)) {
      return file;
    }

    const newPath = resolve(path, "..");

    if (newPath === path) {
      break;
    }

    path = newPath;
  }

  return undefined;
};

// The project's own tool wins. A strict linker such as pnpm links only what the
// project declares, so lib-builder's dependencies are found from lib-builder.
export const binPath = (binName: string): string => {
  const file = findBin(process.cwd(), binName) ?? findBin(__dirname, binName);

  if (file) {
    return file;
  }

  throw new Error(`could not find command: [${binName}]`);
};
