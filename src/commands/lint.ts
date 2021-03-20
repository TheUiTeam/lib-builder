import {green} from '../utils/log';
import {binPath} from '../utils/path';
import {spawn} from '../utils/spawn';

export const lint = async () => {
  const tslint = binPath('eslint');

  green('Running Eslint 🌯');
  await spawn(tslint, [
    '--format',
    'stylish',
    './+(src|__tests__)/**/*.+(ts|tsx)'
  ]);
};
