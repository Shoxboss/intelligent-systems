import { IDecisionTree, IStateTransition } from "../interfaces";

const FL = "flag";
const KI = "kick";

export const GoalieDT: IDecisionTree = {
  state: {
    next: 0,
    sequence: [
      {
        act: FL,
        fl: "gr",
      },
      {
        act: KI,
        fl: "b",
        goal: "gl",
      },
    ],
    action: null,
    command: null,
    isGoal: false,
    isHeardGo: false,
    teammateCoords: [],
    leader: "p",
  },
  root: {
    exec(mgr, state) {
      state.action! = state.sequence[state.next];
      state.command = null;
    },
    next: "goalVisible",
  },
  goalVisible: {
    condition: (mgr, state) =>
      !!state.action?.fl && mgr.getVisible(state.action!.fl),
    trueCond: "rootNext",
    falseCond: "rotate",
  },
  rotate: {
    exec(mgr, state) {
      state.command = {
        n: "turn",
        v: "45",
      };
    },
    next: "sendCommand",
  },
  rootNext: {
    condition: (mgr, state) => !!state.action?.act && state.action.act === FL,
    trueCond: "flagSeek",
    falseCond: "rotateToBall",
  },
  flagSeek: {
    condition: (mgr, state) =>
      !!state.action?.fl && mgr.getDistance(state.action.fl) < 2,
    trueCond: "checkMinDistance",
    falseCond: "farGoal",
  },
  checkMinDistance: {
    condition: (mgr, state) =>
      !!state.action?.fl && mgr.getDistance(state.action.fl) < 1,
    trueCond: "tooCloseGoal",
    falseCond: "closeFlag",
  },
  closeFlag: {
    exec(mgr, state) {
      state.next++;
      state.action! = state.sequence[state.next];
    },
    next: "root",
  },
  tooCloseGoal: {
    condition: (mgr, state) => {
      if (state.action?.fl) {
        const angle = mgr.getAngle(state.action.fl);
        if (angle && angle > 4) return true;
      }

      return false;
    },
    trueCond: "rotateToGoal",
    falseCond: "runFromGoal",
  },
  runFromGoal: {
    exec(mgr, state) {
      state.command = {
        n: "dash",
        v: -100,
      };
    },
    next: "sendCommand",
  },
  farGoal: {
    condition: (mgr, state) => {
      if (state.action?.fl) {
        const angle = mgr.getAngle(state.action.fl);
        if (angle && angle > 4) return true;
      }

      return false;
    },
    trueCond: "rotateToGoal",
    falseCond: "runToGoal",
  },
  rotateToGoal: {
    exec(mgr, state) {
      if (!!state.action?.fl) {
        const angle = mgr.getAngle(state.action.fl);
        if (angle) {
          state.command = {
            n: "turn",
            v: angle,
          };
        }
      }
    },
    next: "sendCommand",
  },
  runToGoal: {
    exec(mgr, state) {
      state.command = {
        n: "dash",
        v: 100,
      };
    },
    next: "sendCommand",
  },
  rotateToBall: {
    condition: (mgr, state) => {
      if (state.action?.fl) {
        const angle = mgr.getAngle(state.action.fl);
        if (angle && angle > 4) return true;
      }

      return false;
    },
    trueCond: "rotateToGoal",
    falseCond: "checkMaxDistanceToBall",
  },
  checkMinDistanceToBall: {
    condition: (mgr, state) =>
      !!state.action?.fl && mgr.getDistance(state.action.fl) > 1.2,
    trueCond: "farGoal",
    falseCond: "checkDistanceForKickAndCatch",
  },
  checkMaxDistanceToBall: {
    condition: (mgr, state) =>
      !!state.action?.fl && mgr.getDistance(state.action.fl) < 28,
    trueCond: "checkMinDistanceToBall",
    falseCond: "rotateToGoal",
  },
  checkDistanceForKickAndCatch: {
    condition: (mgr, state) => {
      let pos = mgr.getMyPos();
      return !!pos && pos[0] ? pos[0] > 40 && Math.abs(pos[1]) < 10 : true;
    },
    trueCond: "doCatch",
    falseCond: "checkDistanceForKick",
  },
  checkDistanceForKick: {
    condition: (mgr, state) =>
      !!state.action?.fl && mgr.getDistance(state.action.fl) <= 0.5,
    trueCond: "doKick",
    falseCond: "farGoal",
  },
  doCatch: {
    exec(mgr, state) {
      if (!!state.action?.fl) {
        state.command = {
          n: "catch",
          v: String(mgr.getAngle(state.action.fl)),
        };
      }
    },
    next: "sendCommand",
  },
  doKick: {
    condition: (mgr, state) => mgr.getVisible(state.action!.goal!),
    trueCond: "ballGoalVisible",
    falseCond: "ballGoalInvisible",
  },
  ballGoalVisible: {
    exec(mgr, state) {
      state.command = {
        n: "kick",
        v: `100 ${mgr.getAngle(state.action!.goal!)}`,
      };
      state.next = 0;
    },
    next: "sendCommand",
  },
  ballGoalInvisible: {
    exec(mgr, state) {
      state.command = {
        n: "kick",
        v: "10 45",
      };
    },
    next: "sendCommand",
  },
  sendCommand: {
    command: (mgr, state) => state.command,
  },
};
