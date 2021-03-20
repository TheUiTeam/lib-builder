import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import {exec} from '../utils/exec';
import {green, red} from '../utils/log';

const copyStatic = async () => {
  green('Copying files 📂');

  const staticPath = path.resolve(__dirname, '../../static');
  await exec(`cp -rfn ${staticPath}/ .`);
};

const modifyPackage = async () => {
  green('Modifing package ⛏');

  const writeFile = promisify(fs.writeFile);
  const pkgPath = path.resolve('./package.json');
  const pkg = require(pkgPath);
  // TODO: Add precommit config
  const newPkg = {
    ...pkg,
    main: 'dist/es5/index.js',
    module: 'dist/es2015/index.js',
    'module:es2019': 'dist/es2019/index.js',
    types: 'dist/es5/index.d.ts',
    engines: {
      node: '>=10'
    },
    scripts: {
      ...pkg.scripts,
      dev: 'lib-builder dev',
      test: 'jest',
      'test:ci': 'jest --runInBand --coverage',
      build: 'lib-builder build && yarn size:report',
      release: 'yarn build && yarn test',
      size: 'npx size-limit',
      'size:report': 'npx size-limit --json > .size.json',
      lint: 'lib-builder lint',
      format: 'lib-builder format',
      update: 'lib-builder update',
      'prepublish': "yarn build && yarn changelog",
      "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s",
      "changelog:rewrite": "conventional-changelog -p angular -i CHANGELOG.md -s -r 0"
    },
    peerDependencies: {
      react: '^16.9.0 || ^17.0.0',
      '@types/react': '^16.9.0 || ^17.0.0',
      ...pkg.peerDependencies,
    },
    peerDependenciesMeta: {
      "@types/react": {
        "optional": true
      },
      ...pkg.peerDependenciesMeta,
    },
    dependencies: {
      tslib: '^2.0.0',
      ...pkg.dependencies,
    },
    devDependencies: {
      '@theuiteam/lib-builder': '^0.0.1',
      '@size-limit/preset-small-lib': '^2.1.6',
      ...pkg.devDependencies,
    },
    files: ['dist'],
    keywords: pkg.keywords || [],
    repository: pkg.repository || '',
    'husky': {
      'hooks': {
        'pre-commit': 'lint-staged'
      }
    },
    'lint-staged': {
      '*.{ts,tsx}': [
        'prettier --write',
        'tslint --fix',
        'git add'
      ],
      '*.{js,css,json,md}': [
        'prettier --write',
        'git add'
      ]
    },
    'prettier': {
      'printWidth': 120,
      'trailingComma': 'es5',
      'tabWidth': 2,
      'semi': true,
      'singleQuote': true
    }
  };

  await writeFile(pkgPath, JSON.stringify(newPkg, null, 2));
};


export const init = async () => {
  try {
    await modifyPackage();
    await copyStatic();
    green('Project created 🚀');
  } catch (err) {
    red(err);
  }
};
