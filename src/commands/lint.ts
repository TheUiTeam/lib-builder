import * as path from 'path';
import {binPath} from "../utils/path";
import {green} from "../utils/log";
import {spawn} from "../utils/spawn";

export const lint = async () => {
  const tslint = binPath('tslint');
  const configPath = path.resolve(__dirname, '../../configs/tslint.json');

  // TODO: we want to first run // node_modules/.bin/tslint-config-prettier-check ./tslint.json
  green('Running TSLint 🌯');
  await spawn(tslint, [
    '-c',
    configPath,
    '--format',
    'stylish',
    './+(src|__tests__)/**/*.+(ts|tsx)'
  ]);
};
