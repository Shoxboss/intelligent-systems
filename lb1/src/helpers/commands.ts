export interface CommandObject {
  act: string;
  fl: string;
  goal?: string;
}

// ActionType enum represents the different types of flags that can be used in a command.
export enum ActionType {
  DIST = "dist",
  DIR = "dir",
  POWER = "power",
  CENTER = "c",
  TARGET = "target",
}

export interface IAction {
  type: ActionType;
  value: number | string;
}

export class Action implements IAction {
  constructor(public type: ActionType, public value: number | string) {}
}

export interface ICommand {
  action: string;
  flags: IAction[];
  toString: () => string;
  chain: (command: ICommand) => ICommand;
}

export class Command implements ICommand {
  action: string;
  flags: IAction[];
  private nextCommand: ICommand | undefined;

  constructor(action: string, flags: IAction[]) {
    this.action = action;
    this.flags = flags;
  }

  toString(): string {
    const flagStrings = this.flags.map((flag) => `${flag.value}`);
    return `(${this.action} ${flagStrings.join(" ")})`;
  }

  public chain(command: ICommand): ICommand {
    if (!this.nextCommand) {
      this.nextCommand = command;
    } else {
      this.nextCommand.chain(command);
    }
    return this;
  }

  public getNextCommand(): ICommand | undefined {
    return this.nextCommand;
  }
}

export class KickCommand extends Command {
  constructor(
    power: number,
    direction: number
    // target: ActionType = ActionType.CENTER
  ) {
    super("kick", [
      new Action(ActionType.POWER, power),
      new Action(ActionType.DIR, direction),
      // new Action(ActionType.TARGET, target),
    ]);
  }
}

export class DashCommand extends Command {
  constructor(power: number, direction: number) {
    super("dash", [
      new Action(ActionType.POWER, power),
      new Action(ActionType.DIR, direction),
    ]);
  }
}

export class TurnCommand extends Command {
  constructor(direction: number) {
    super("turn", [new Action(ActionType.DIR, direction)]);
  }
}

export class MoveCommand extends Command {
  constructor(x: number, y: number) {
    super("move", [
      new Action(ActionType.DIR, x),
      new Action(ActionType.DIR, y),
    ]);
  }
}
