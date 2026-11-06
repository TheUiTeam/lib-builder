module.exports = {
  roots: ["<rootDir>/__tests__"],
  testMatch: ["**/*.spec.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "<rootDir>/__tests__/tsconfig.json" }],
  },
};
