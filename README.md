# uiteam / lib-builder
> Opinionated toolbox boilerplate to create Typescript React components, based on [ts-react-toolbox](https://github.com/zzarcon/ts-react-toolbox)

# Install

```
yarn add --dev @theuiteam/lib-builder
```

# Setup

After you have installed it, run this from the root of your package:

```
$ node_modules/.bin/lib-builder init
```

That will add all the boilerplate and scripts to your project

# Contains

* Typescript ✅
* React + ReactDom ✅
* Webpack + WebpackDevServer ✅
* Jest ✅
* Travis config ✅
* TSLint ✅
* Prettier ✅
* ES5 support ✅
* ES2015 support ✅
* Git hooks ✅
* Bundle size analyzer ✅

# Folder structure

* `__tests__`
* `example`
* `src`

# Commands

* **init**: Initializes project
* **test**: jest + watch mode
* **build**: Typescript build
* **docz:dev** Dev mode

* **release**: build + run tests + version bump + publish to registry
* **static**: deploys example to github pages
* **lint**: tslint
* **format**: prettier
* **analyze**: webpack-bundle-analyzer

# Entry points

* **package.json**

```json
"main": "dist/es5/index.js",
"jsnext:main": "dist/es2015/index.js",
"module": "dist/es2015/index.js",
"types": "dist/es5/index.d.ts"
```

# Inspired by

Dan Abramov - The Melting Pot of JavaScript : https://www.youtube.com/watch?v=G39lKaONAlA
