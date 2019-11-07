import {spawn} from 'child_process';
import {writeFileSync} from 'fs';
import * as tmp from 'tmp';
import {green, red} from '../utils/log';
import {binPath} from '../utils/path';

const cwd = process.cwd();

const es5Config = {
  'declaration': true,
  'outDir': `${cwd}/dist/es5`,
  'target': 'es5',
};

const es2015Config = {
  ...es5Config,
  'outDir': `${cwd}/dist/es2015`,
  'module': 'es2015',
};

const makeConfig = (options: any) => ({
  'extends': cwd + '/tsconfig.json',
  'compilerOptions': options,
  // 'include': [`${cwd}/src/**/*.ts`, `${cwd}/src/**/*.tsx`]
});

const tscBin = binPath('tsc');
const buildES5 = (): Promise<void> => {
  return new Promise((resolve) => {
    green('Creating ES5 dist 🌟');

    const tmpobj = tmp.fileSync();
    const configPath = tmpobj.name;
    writeFileSync(configPath, JSON.stringify(makeConfig(es5Config), null, ' '));
    // NODE_ENV=production
    const subprocess = spawn(tscBin, ['-p', configPath], {
      env: {...process.env, FORCE_COLOR: 'true'},
      stdio: 'inherit'
    });

    subprocess.on('exit', () => {
      tmpobj.removeCallback();
      resolve();
    });
  });
};

const buildES2015 = () => {
  return new Promise((resolve) => {
    green('Creating ES2015 dist 🌟🌟');

    const tmpobj = tmp.fileSync();
    const configPath = tmpobj.name;
    writeFileSync(configPath, JSON.stringify(makeConfig(es2015Config), null, ' '));
    const subprocess = spawn(tscBin, ['-p', configPath], {
      env: {...process.env, FORCE_COLOR: 'true'},
      stdio: 'inherit'
    });

    subprocess.on('exit', () => {
      tmpobj.removeCallback();
      resolve();
    });
  });
};

export const build = async () => {
  try {
    await buildES5();
    await buildES2015();
  } catch (e) {
    red(e);
    process.exit(1);
  }
};
