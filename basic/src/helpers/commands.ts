export class Command {
  constructor(public readonly name: string, public readonly value: string | number) {}
  get cmd() {
    return `(${this.name} ${this.value})`;
  }
}

export class KickCommand extends Command {
  constructor(public readonly value: string | number) {
    super("kick", value);
  }
}

export class DashCommand extends Command {
  constructor(public readonly value: string | number) {
    super("dash", value);
  }
}

export class TurnCommand extends Command {
  constructor(public readonly value: string | number) {
    super("turn", value);
  }
}