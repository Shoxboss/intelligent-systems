export interface ICommand {
  toString(): string;
}

export interface ITurnCommand extends ICommand {
  angle: number;
}

export interface IDashCommand extends ICommand {
  power: number;
}

export interface IKickCommand extends ICommand {
  power: number;
  direction: number;
}

