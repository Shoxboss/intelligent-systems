import { IAction } from "../interfaces";

export class Action implements IAction {
  private _next: IAction | null = null;
  constructor(
    public act: string,
    public fl: string,
    public goal?: string | undefined
  ) {}

  get next() {
    return this._next;
  }

  chain(action: IAction | null) {
    this._next = action;
  }
}

export class FlagAction extends Action {
  constructor(flag: string, goal?: string | undefined) {
    super("flag", flag, goal);
  }
}

export class KickAction extends Action {
  constructor(flag: string, goal?: string | undefined) {
    super("kick", flag, goal);
  }
}
