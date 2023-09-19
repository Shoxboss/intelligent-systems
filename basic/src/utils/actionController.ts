import { Action, IAction } from "../helpers/actions";

export class ActionController {
  private __current: IAction | null = null;
  private __head: IAction | null = null;

  constructor() {}
  chain(action: IAction | null) {
    if (!this.__head) {
      this.__current = this.__head = action;
      return this;
    }
    let tail = this.__current;
    while (tail?.next) {
      tail = tail.next;
    }
    if (tail) {
      tail.chain(action);
    }
    return this;
  }
  get current() {
    return this.__current;
  }

  reset() {
    this.__current = this.__head;
    return this;
  }

  next() {
    if (this.__current) {
      this.__current = this.__current.next;
    }
    return this;
  }
}
