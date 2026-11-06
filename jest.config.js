const { withTestSelection } = require("@variance-authority/sense/jest");

module.exports = withTestSelection(
  {
    roots: ["<rootDir>/__tests__"],
    testMatch: ["**/*.spec.ts"],
    transform: {
      "^.+\\.ts$": [
        "ts-jest",
        { tsconfig: "<rootDir>/__tests__/tsconfig.json" },
      ],
    },
  },
  { suite: "unit" },
);
