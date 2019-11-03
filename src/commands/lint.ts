import {binPath} from "../utils/path";
import {green} from "../utils/log";
import {spawn} from "../utils/spawn";

export const lint = async () => {
  const tslint = binPath('tslint');

  green('Running TSLint 🌯');
  await spawn(tslint, [
    '--format',
    'stylish',
    './+(src|__tests__)/**/*.+(ts|tsx)'
  ]);
};
