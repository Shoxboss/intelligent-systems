import {
  IManager,
  IMsgP,
  IDecisionTree,
  ICommand,
  IStateAction,
  IStateTransition,
  ICommandGenerator,
} from "../../interfaces";
import { getPosition, getDistanceForOtherPlayer } from "../location";

const manager: IManager = {
  p: [] as IMsgP[],
  getAction(dt: IDecisionTree, p: any[]): ICommand | null {
    this.p = p;

    const execute = (
      dt: IDecisionTree,
      title: string,
      Manager: IManager
    ): ICommand | null => {
      const action = dt[title];

      if (typeof (action as IStateAction).exec === "function") {
        (action as IStateAction).exec(Manager, dt.state);
        return execute(dt, (action as IStateAction).next, Manager);
      }
      if (typeof (action as IStateTransition).condition === "function") {
        const cond: boolean = (action as IStateTransition).condition(
          Manager,
          dt.state
        );
        if (cond)
          return execute(dt, (action as IStateTransition).trueCond, Manager);
        return execute(dt, (action as IStateTransition).falseCond, Manager);
      }
      if (typeof (action as ICommandGenerator).command === "function") {
        return (action as ICommandGenerator).command(Manager, dt.state);
      }
      throw new Error(`Unexpected node in DT: ${title}`);
    };

    return execute(dt, "root", this);
  },

  getVisible(goal: string): boolean {
    const is_visible =
      goal === "p"
        ? Boolean(this.p.find((obj) => obj.cmd && obj.cmd.p[0] === goal))
        : Boolean(this.p.find((obj) => obj.cmd && obj.cmd.p.join("") === goal));

    return is_visible;
  },

  getDistance(goal: string): number {
    const goalObj: IMsgP | undefined =
      goal === "p"
        ? this.p.find((obj) => obj.cmd && obj.cmd.p[0] === goal)
        : this.p.find((obj) => obj.cmd && obj.cmd.p.join("") === goal);

    return goalObj && goalObj.p.length > 1 ? goalObj.p[0] : Number.MAX_VALUE;
  },
  getAngle(goal: string): number | null {
    const goalObj =
      goal === "p"
        ? this.p.find((obj) => obj.cmd && obj.cmd.p[0] === goal)
        : this.p.find((obj) => obj.cmd && obj.cmd.p.join("") === goal);

    if (!goalObj) return null;

    if (goalObj.p.length === 1) {
      return goalObj.p[0];
    }

    return goalObj.p[1];
  },

  getMyPos(): number[] | null {
    const pos = getPosition(this.p);

    if (pos) {
      return [pos.x, pos.y];
    }
    return null;
  },
  getTeammatePos(teamName) {
    const flags = this.p.filter(
      (obj) => obj.cmd && (obj.cmd.p[0] === "f" || obj.cmd.p[0] === "g")
    );
    const player = this.p.find(
      (obj) =>
        obj.cmd && obj.cmd.p[0] === "p" && obj.cmd.p[1] === `"${teamName}"`
    );

    if (player) {
      const newFlags = getDistanceForOtherPlayer(player, flags);
      const pos = getPosition(newFlags);
      if (pos) {
        return { x: pos.x, y: pos.y, angle: player.p[1] };
      }
    }
    return null;
  },
  getAngleToPass(playerPos) {
    if (playerPos.length < 2) {
      throw new Error("playerPos must have at least 2 elements");
    }

    const [player1, player2] = playerPos;
    const { pos: pos1, angle: angle1 } = player1;
    const { pos: pos2, angle: angle2 } = player2;

    const midPos = {
      x: pos2.x + 18 * (pos2.x - pos1.x),
      y: pos2.y + 18 * (pos2.y - pos1.y),
    };

    const dotProduct = pos2.x * midPos.x + pos2.y * midPos.y;
    const playerDist = Math.sqrt(pos2.x ** 2 + pos2.y ** 2);
    const midDist = Math.sqrt(midPos.x ** 2 + midPos.y ** 2);
    const cosAngle = dotProduct / (playerDist * midDist);

    const angleOffset = (Math.acos(cosAngle) * 180) / Math.PI;
    const targetAngle =
      angle2 > angle1 ? angle2 + angleOffset : angle2 - angleOffset;

    return targetAngle;
  },
};

export default manager;
