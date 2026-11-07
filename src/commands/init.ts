import { cpSync, existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

import { green } from "../utils/log.ts";
import { mergePackage } from "../utils/package-defaults.ts";
import {
  detectPackageManager,
  fillManagerTemplate,
  PackageManager,
} from "../utils/package-manager.ts";

const builderRoot = resolve(__dirname, "../..");

// Static files that name the package manager, written for the project's own.
const managerTemplates = [".github/workflows/ci.yml", ".husky/pre-commit"];

const readJson = (file: string) => JSON.parse(readFileSync(file, "utf8"));

const copyStatic = (manager: PackageManager) => {
  green("Copying files 📂");

  const missing = managerTemplates.filter((file) => !existsSync(file));

  cpSync(resolve(builderRoot, "static"), ".", {
    recursive: true,
    force: false,
  });

  missing.forEach((file) => {
    writeFileSync(
      file,
      fillManagerTemplate(readFileSync(file, "utf8"), manager),
    );
  });
};

const modifyPackage = (manager: PackageManager) => {
  green("Modifying package ⛏");

  const pkgPath = resolve("./package.json");
  const { version } = readJson(resolve(builderRoot, "package.json"));
  const merged = mergePackage(readJson(pkgPath), version, manager);

  writeFileSync(pkgPath, `${JSON.stringify(merged, null, 2)}\n`);
};

export const init = async () => {
  const manager = detectPackageManager(process.cwd());

  modifyPackage(manager);
  copyStatic(manager);
  green("Project created 🚀");
};
