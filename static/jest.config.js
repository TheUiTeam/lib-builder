module.exports = {
  preset: "ts-jest",
  // tsconfig rewrites `./file.ts` to `./file.js`, which jest cannot resolve
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
