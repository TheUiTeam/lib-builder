import {
  exists as nodeExists,
  writeFile as nodeWriteFile,
  mkdir as nodeMkdir,
  copyFile as nodeCopyFile
} from 'fs';
import {promisify} from 'util';

const exists = promisify(nodeExists);
const mkdir = promisify(nodeMkdir);
const writeFile = promisify(nodeWriteFile);

export const createFile = async (path: string, data: string) => {
  if (!await exists(path)) {
    return writeFile(path, data);
  }
};

export const createFolder = async (path: string) => {
  if (!await exists(path)) {
    return mkdir(path);
  }
};

export const copyFile = promisify(nodeCopyFile);

