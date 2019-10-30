import {green} from "../utils/log";
import {binPath} from "../utils/path";
import {spawn} from "../utils/spawn";

export const format = async () => {
  green('Running Prettier 🥑');

  const prettier = binPath('prettier');

  await spawn(prettier, [
    'src/**/*.+(ts|tsx)',
    '--write'
  ]);
};
