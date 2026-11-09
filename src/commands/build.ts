import { writeFileSync } from "fs";

import * as tmp from "tmp";

import { green } from "../utils/log.ts";
import { binPath } from "../utils/path.ts";
import { spawn } from "../utils/spawn.ts";

interface TargetOptions {
  declaration: boolean;
  outDir: string;
  target: string;
  module?: string;
  moduleResolution?: string;
  verbatimModuleSyntax?: boolean;
}

const makeTargets = (cwd: string): [TargetOptions, TargetOptions] => {
  const es5: TargetOptions = {
    declaration: true,
    outDir: `${cwd}/dist/es5`,
    target: "es5",
  };

  return [
    es5,
    {
      ...es5,
      outDir: `${cwd}/dist/es2015`,
      module: "es2015",
      moduleResolution: "node",
      verbatimModuleSyntax: true,
    },
  ];
};

const makeConfig = (cwd: string, options: TargetOptions) => ({
  extends: cwd + "/tsconfig.json",
  compilerOptions: options,
  include: [`${cwd}/src/**/*.ts`, `${cwd}/src/**/*.tsx`],
});

const buildTarget = async (
  tscBin: string,
  cwd: string,
  options: TargetOptions,
) => {
  green(`Creating ${options.target}/${options.module} dist 🌟`);

  const tmpobj = tmp.fileSync();

  try {
    writeFileSync(
      tmpobj.name,
      JSON.stringify(makeConfig(cwd, options), null, " "),
    );

    // NODE_ENV=production
    await spawn(tscBin, ["-p", tmpobj.name], { stdio: "inherit" });
  } finally {
    tmpobj.removeCallback();
  }
};

export const build = async () => {
  const cwd = process.cwd();
  const tscBin = binPath("tsc");
  const [es5, es2015] = makeTargets(cwd);

  // Both compilers finish before a failure surfaces: leaving one running
  // would strand its temporary config when the process exits.
  const failures = await Promise.all(
    [es5, es2015].map((options) =>
      buildTarget(tscBin, cwd, options).then(
        () => undefined,
        (error: Error) => error,
      ),
    ),
  );

  const failure = failures.filter(Boolean)[0];

  if (failure) {
    throw failure;
  }

  writeFileSync(`${es2015.outDir}/package.json`, `{"type": "module"}`);
};
