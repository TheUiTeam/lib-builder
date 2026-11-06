type Dictionary = Record<string, string>;

export interface PackageJson {
  main?: string;
  scripts?: Dictionary;
  peerDependencies?: Dictionary;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
  dependencies?: Dictionary;
  devDependencies?: Dictionary;
  [key: string]: unknown;
}

// What `npm init` writes when nobody chose a value.
const PLACEHOLDER_MAIN = "index.js";
const PLACEHOLDER_TEST = 'echo "Error: no test specified" && exit 1';

const SUPPORTED_REACT = "^16.9.0 || ^17.0.0 || ^18.0.0 || ^19.0.0";

const makeDefaults = (builderVersion: string) => ({
  main: "dist/es5/index.js",
  module: "dist/es2015/index.js",
  types: "dist/es5/index.d.ts",
  scripts: {
    test: "jest",
    "test:ci": "jest --runInBand --coverage",
    build: "lib-builder build && yarn size:report",
    release: "yarn build && yarn test",
    size: "size-limit",
    "size:report": "size-limit --json > .size.json",
    lint: "lib-builder lint",
    format: "lib-builder format",
    update: "lib-builder update",
    prepack: "yarn build && yarn changelog",
    prepare: "husky",
    changelog: "conventional-changelog -p angular -i CHANGELOG.md -s",
    "changelog:rewrite":
      "conventional-changelog -p angular -i CHANGELOG.md -s -r 0",
  },
  peerDependencies: {
    react: SUPPORTED_REACT,
    "@types/react": SUPPORTED_REACT,
  },
  peerDependenciesMeta: {
    "@types/react": {
      optional: true,
    },
  },
  dependencies: {
    tslib: "^2.1.0",
  },
  devDependencies: {
    "@theuiteam/lib-builder": `^${builderVersion}`,
    "@size-limit/preset-small-lib": "^11.1.6",
  },
  files: ["dist"],
  keywords: [],
  repository: "",
  "lint-staged": {
    "*.{ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{js,css,json,md}": ["prettier --write"],
  },
  prettier: {
    printWidth: 120,
    trailingComma: "es5",
    tabWidth: 2,
    semi: true,
    singleQuote: true,
  },
  packageManager: "yarn@1.22.19",
});

/**
 * Fills in what the package does not declare. A value the package already
 * has is its author's, and stays, in the place it already holds.
 */
export const mergePackage = (
  pkg: PackageJson,
  builderVersion: string,
): PackageJson => {
  const defaults = makeDefaults(builderVersion);
  const { main, ...declared } = pkg;
  const { test, ...scripts } = pkg.scripts ?? {};

  return {
    ...pkg,
    ...defaults,
    ...declared,
    ...(main && main !== PLACEHOLDER_MAIN ? { main } : {}),
    scripts: {
      ...pkg.scripts,
      ...defaults.scripts,
      ...scripts,
      ...(test && test !== PLACEHOLDER_TEST ? { test } : {}),
    },
    peerDependencies: { ...defaults.peerDependencies, ...pkg.peerDependencies },
    peerDependenciesMeta: {
      ...defaults.peerDependenciesMeta,
      ...pkg.peerDependenciesMeta,
    },
    dependencies: { ...defaults.dependencies, ...pkg.dependencies },
    devDependencies: { ...defaults.devDependencies, ...pkg.devDependencies },
  };
};
