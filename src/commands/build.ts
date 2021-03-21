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

const es2019Config = {
  ...es5Config,
  'target': 'ES2019',
  'outDir': `${cwd}/dist/es2019`,
  'module': 'es2015',
};

const makeConfig = (options: any) => ({
  'extends': cwd + '/tsconfig.json',
  'compilerOptions': options,
  'include': [`${cwd}/src/**/*.ts`, `${cwd}/src/**/*.tsx`]
});

const tscBin = binPath('tsc');

const buildTarget = (config: any) => (
  new Promise((resolve) => {
    green(`Creating ${config.target}/${config.module} dist 🌟`);

    const tmpobj = tmp.fileSync();
    const configPath = tmpobj.name;
    writeFileSync(configPath, JSON.stringify(makeConfig(config), null, ' '));
    // NODE_ENV=production
    const subprocess = spawn(tscBin, ['-p', configPath], {
      env: {...process.env, FORCE_COLOR: 'true'},
      stdio: 'inherit'
    });

    subprocess.on('exit', () => {
      tmpobj.removeCallback();
      resolve(undefined);
    });
  })
);

export const build = async () => {
  try {
    await Promise.all([
      buildTarget(es5Config),
      buildTarget(es2015Config),
      buildTarget(es2019Config),
    ])
  } catch (e) {
    red(e);
    process.exit(1);
  }
};
