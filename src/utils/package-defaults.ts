import { DEFAULT_PACKAGE_MANAGER, PackageManager } from "./package-manager.ts";

type Dictionary = Record<string, string>;

export interface PackageJson {
  version?: string;
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

// Every package the generated scripts, hook and static configs call or load.
// A strict linker such as pnpm links only what the project declares, so none
// of them may come through lib-builder's own dependencies.
const PROJECT_TOOLS = [
  "@size-limit/preset-small-lib",
  "@types/jest",
  "@types/node",
  "@typescript-eslint/eslint-plugin",
  "@typescript-eslint/parser",
  "conventional-changelog-cli",
  "eslint",
  "eslint-config-prettier",
  "eslint-import-resolver-typescript",
  "eslint-plugin-import",
  "eslint-plugin-react",
  "eslint-plugin-react-hooks",
  "husky",
  "jest",
  "lint-staged",
  "prettier",
  "size-limit",
  "ts-jest",
  "typescript",
];

/** The tools, at the ranges lib-builder itself is tested with. */
const projectTools = ({ dependencies, devDependencies }: PackageJson) => {
  const ranges: Dictionary = { ...devDependencies, ...dependencies };

  return Object.fromEntries(
    PROJECT_TOOLS.map((name) => {
      if (!ranges[name]) {
        throw new Error(`lib-builder does not depend on ${name}`);
      }

      return [name, ranges[name]];
    }),
  );
};

const makeDefaults = (
  builder: PackageJson,
  { run, source }: PackageManager,
) => ({
  main: "dist/es5/index.js",
  module: "dist/es2015/index.js",
  types: "dist/es5/index.d.ts",
  scripts: {
    test: "jest",
    "test:ci": "jest --runInBand --coverage",
    build: `lib-builder build && ${run} size:report`,
    release: `${run} build && ${run} test`,
    size: "size-limit",
    "size:report": "size-limit --json > .size.json",
    lint: "lib-builder lint",
    format: "lib-builder format",
    update: "lib-builder update",
    prepack: `${run} build && ${run} changelog`,
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
    "@theuiteam/lib-builder": `^${builder.version}`,
    ...projectTools(builder),
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
  // A lockfile already answers, and a pin nobody chose would only invent a version.
  ...(source === "default" ? { packageManager: DEFAULT_PACKAGE_MANAGER } : {}),
});

/**
 * Fills in what the package does not declare. A value the package already
 * has is its author's, and stays, in the place it already holds.
 */
export const mergePackage = (
  pkg: PackageJson,
  builder: PackageJson,
  manager: PackageManager,
): PackageJson => {
  const defaults = makeDefaults(builder, manager);
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
