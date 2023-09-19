enum BehaviorResult {
  Success,
  Failure,
  Running,
}

abstract class BehaviorNode {
  abstract execute(): BehaviorResult;
}

class SequenceNode extends BehaviorNode {
  private children: BehaviorNode[];

  constructor(children: BehaviorNode[]) {
    super();
    this.children = children;
  }

  execute(): BehaviorResult {
    for (const child of this.children) {
      const result = child.execute();
      if (
        result === BehaviorResult.Failure ||
        result === BehaviorResult.Running
      ) {
        return result;
      }
    }
    return BehaviorResult.Success;
  }
}

class ConditionNode extends BehaviorNode {
  private condition: () => boolean;

  constructor(condition: () => boolean) {
    super();
    this.condition = condition;
  }

  execute(): BehaviorResult {
    return this.condition() ? BehaviorResult.Success : BehaviorResult.Failure;
  }
}

class ActionNode extends BehaviorNode {
  private action: () => void;

  constructor(action: () => void) {
    super();
    this.action = action;
  }

  execute(): BehaviorResult {
    this.action();
    return BehaviorResult.Success;
  }
}

class SelectorNode implements BehaviorNode {
  private children: BehaviorNode[];

  constructor(children: BehaviorNode[]) {
    this.children = children;
  }

  execute(): BehaviorResult {
    for (const child of this.children) {
      const result = child.execute();
      if (result === BehaviorResult.Success) {
        return BehaviorResult.Success;
      } else if (result === BehaviorResult.Running) {
        return BehaviorResult.Running;
      }
    }
    return BehaviorResult.Failure;
  }
}

class CounterNode extends BehaviorNode {
  private child: BehaviorNode;
  private count: number;
  private maxCount: number;

  constructor(child: BehaviorNode, maxCount: number) {
    super();
    this.child = child;
    this.maxCount = maxCount;
    this.count = 0;
  }

  public execute(): BehaviorResult {
    const status = this.child.execute();
    if (status === BehaviorResult.Success) {
      this.count++;
      if (this.count >= this.maxCount) {
        this.count = 0;
        return BehaviorResult.Success;
      }
      return BehaviorResult.Running;
    }
    this.count = 0;
    return BehaviorResult.Failure;
  }
}

class InverterNode extends BehaviorNode {
  private child: BehaviorNode;

  constructor(child: BehaviorNode) {
    super();
    this.child = child;
  }

  public execute(): BehaviorResult {
    const status = this.child.execute();
    if (status === BehaviorResult.Success) {
      return BehaviorResult.Failure;
    }
    if (status === BehaviorResult.Failure) {
      return BehaviorResult.Success;
    }
    return BehaviorResult.Running;
  }
}

class DecoratorNode extends BehaviorNode {
  private child: BehaviorNode;
  private decoratorFunc: (status: BehaviorResult) => BehaviorResult;

  constructor(
    child: BehaviorNode,
    decoratorFunc: (status: BehaviorResult) => BehaviorResult
  ) {
    super();
    this.child = child;
    this.decoratorFunc = decoratorFunc;
  }

  public execute(): BehaviorResult {
    const status = this.child.execute();
    return this.decoratorFunc(status);
  }
}
