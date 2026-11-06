import { cpSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { green } from "../utils/log.ts";
import { mergePackage } from "../utils/package-defaults.ts";

const builderRoot = resolve(__dirname, "../..");

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

const copyStatic = () => {
  green("Copying files 📂");

  cpSync(resolve(builderRoot, "static"), ".", {
    recursive: true,
    force: false,
  });
};

const modifyPackage = () => {
  green("Modifying package ⛏");

  const pkgPath = resolve("./package.json");
  const { version } = readJson(resolve(builderRoot, "package.json"));
  const merged = mergePackage(readJson(pkgPath), version);

  writeFileSync(pkgPath, `${JSON.stringify(merged, null, 2)}\n`);
};

export const init = async () => {
  modifyPackage();
  copyStatic();
  green("Project created 🚀");
};
