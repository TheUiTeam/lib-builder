import * as path from 'path';
import * as fs from 'fs';
import { promisify } from 'util';
import {green} from "../utils/log";
import {exec} from "../utils/exec";

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
    types: 'dist/es5/index.d.ts',
    engines: {
      node: '>=10'
    },
    scripts: {
      ...pkg.scripts,
      dev: 'team-build.js dev',
      test: 'jest',
      'test:ci': 'jest --runInBand --coverage',
      build: 'team-build build',
      release: 'team-build release',
      size: 'npx size-limit',
      lint: 'team-build lint',
      format: 'team-build format',
      "docz:dev": "docz dev",
      "docz:build": "docz build"
    },
    peerDependencies: {
      react: '^16.10.0',
    },
    devDependencies: {
      '@uiteam/build': '^0.0.0',
    },
    files: ['dist'],
    keywords: pkg.keywords || [],
    repository: pkg.repository || '',
    "husky": {
      "hooks": {
        "pre-commit": "lint-staged"
      }
    },
    "lint-staged": {
      "*.{ts,tsx}": [
        "prettier --write",
        "tslint --fix",
        "git add"
      ],
      "*.{js,css,json,md}": [
        "prettier --write",
        "git add"
      ]
    },
    "prettier": {
      "printWidth": 120,
      "trailingComma": "es5",
      "tabWidth": 2,
      "semi": true,
      "singleQuote": true
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
    console.log(err);
  }
};
