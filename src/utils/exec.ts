import * as childProcess from 'child_process';
import { promisify } from 'util';

export const exec = async (command: string) => {
  const execFunc = promisify(childProcess.exec);

  return execFunc(command);
};
