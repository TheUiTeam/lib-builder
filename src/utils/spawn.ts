import { spawn as nativeSpawn, SpawnOptions } from 'child_process';
import {red, white} from './log';

export const spawn = (command: string, args: string[], options?: SpawnOptions) =>
  new Promise((resolve, reject) => {
    const child = nativeSpawn(command, args, {
      ...options,
      env: { ...process.env, FORCE_COLOR: 'true' }
    });

    child.stdout!.on('data', white);
    child.stderr!.on('data', red);
    child.on('close', code => {
      if (code !== 0) {
        reject();
      }

      resolve(undefined);
    });
  });
