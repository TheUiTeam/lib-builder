import * as commands from './commands';

const [, , command] = process.argv;

export type Command = keyof typeof commands

const isCommand = (command: string): command is Command => {
  return Object.keys(commands).indexOf(command) >= 0;
};

if (isCommand(command)) {
  commands[command]();
} else {
  throw new Error(`invalid command name ${command}`);
}