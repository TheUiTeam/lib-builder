import * as commands from "./commands/index.ts";
import { red } from "./utils/log.ts";

const [, , command] = process.argv;

export type Command = keyof typeof commands;

const isCommand = (command: string): command is Command => {
  return Object.keys(commands).indexOf(command) >= 0;
};

if (isCommand(command)) {
  commands[command]().catch((error: Error) => {
    red(error.message);
    process.exitCode = 1;
  });
} else {
  throw new Error(`invalid command name ${command}`);
}
