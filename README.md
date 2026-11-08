# uiteam / lib-builder

[![test evidence: Variance Authority](https://img.shields.io/badge/test%20evidence-Variance%20Authority-blue?style=flat-square)](https://variance-authority.dev/) [![regions run](https://img.shields.io/endpoint?url=https%3A%2F%2Fraw.githubusercontent.com%2FTheUiTeam%2Flib-builder%2Frefs%2Fbadge%2Fmaster%2Fregions-run.json)](https://github.com/TheUiTeam/lib-builder/actions)

> Opinionated toolbox boilerplate to create Typescript React components, based on [ts-react-toolbox](https://github.com/zzarcon/ts-react-toolbox)

# Install

```
yarn add --dev @theuiteam/lib-builder
```

Needs Node 22.19, 24.5, or 26 and newer. It brings `tsc`, `jest`, `eslint`, `prettier`, `husky` and `size-limit` with it, and `init` declares each of them, with the plugins its configs load, in your `devDependencies` at the range lib-builder uses, so they resolve under any package manager, pnpm included.

# Setup

After you have installed it, run this from the root of your package:

```
$ node_modules/.bin/lib-builder init
```

`init` fills in the `package.json` fields and scripts your package does not have yet, and copies the configuration files it does not have yet. A value or a file you already have stays as it is, so `init` can be run again. The exceptions are the placeholders `npm init` writes, `"main": "index.js"` and the `no test specified` test script, which it replaces.

The scripts, the GitHub Actions workflow and the pre-commit hook are written for your package manager: the one `packageManager` names, otherwise the one a lockfile shows. A project with neither gets yarn, and a `packageManager` field that says so. A manager other than npm, pnpm or yarn stops `init` and `update` with an error. A pnpm project with no `packageManager` gets a workflow on the latest pnpm; declare one to pin it.

The workflow builds the library, runs `test:ci`, and checks that the packed package holds `main`, `module` and `types`.

# Contains

- Typescript ✅
- Jest ✅
- GitHub Actions workflow ✅
- ESLint ✅
- Prettier ✅
- ES5 support ✅
- ES2015 support ✅
- Git hooks ✅
- Bundle size analyzer ✅

# Folder structure

- `__tests__`
- `src`

# Commands

- **init**: sets up the project, as above
- **build**: compiles `src` to `dist/es5` and `dist/es2015`, and exits non-zero when the compiler reports an error
- **lint**: eslint over `src` and `__tests__`
- **format**: prettier over `src`
- **update**: updates lib-builder with your package manager, chosen as `init` chooses it

# Entry points

- **package.json**

```json
"main": "dist/es5/index.js",
"module": "dist/es2015/index.js",
"types": "dist/es5/index.d.ts"
```

`dist/es2015` holds a `package.json` with `{"type": "module"}`.

# Releasing

Pushing a `v*` tag runs `.github/workflows/release.yml`. It checks that the tag equals the version in `package.json`, builds, tests, and publishes with provenance. There is no npm token: npm trusts the workflow through OIDC.

```
npm version <patch|minor|major>
git push origin master --follow-tags
```

Once, before the first release, on npmjs.com: open the package's **Settings**, and under **Trusted Publisher** choose GitHub Actions with organization `TheUiTeam`, repository `lib-builder` and workflow filename `release.yml`.

# Inspired by

Dan Abramov - The Melting Pot of JavaScript : https://www.youtube.com/watch?v=G39lKaONAlA
