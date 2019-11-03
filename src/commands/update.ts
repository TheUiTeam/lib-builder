import {green} from '../utils/log';
import {spawn} from '../utils/spawn';

export const update = async () => {

  green('Updating lib-builder 🌯');
  await spawn('yarn', [
    'add',
    '--dev',
    '@theuiteam/lib-builder'
  ]);
};
