import {resolve} from 'path';
import {existsSync} from 'fs';

const cwd = process.cwd();

export const binPath = (binName: string):string => {
  let path = cwd;
  while (path) {
    const file = resolve(path, 'node_modules', '.bin', binName);
    if (existsSync(file)) {
      return file;
    }
    const newPath = resolve(path, '..');
    if(newPath === path){
      break;
    }
    path = newPath;
  }
  throw new Error(`could not find command: [${binName}]`);

  return 'error';
};
