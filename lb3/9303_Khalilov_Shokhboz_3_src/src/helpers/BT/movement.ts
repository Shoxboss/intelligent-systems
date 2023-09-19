import { ACTION } from "../../constants/actions";
import { IDecisionTree, ICommand } from "../../interfaces";


export const FlagDT: IDecisionTree = {
  state: {
    next: 0,
    sequence: [
      {
        act: ACTION.FL,
        fl: "gl",
      },
      {
        act: ACTION.KI,
        fl: "b",
        goal: "gr",
      },
    ],
    action: null,
    command: null,
    leader: "p",
  },
  root: {
    exec(mgr, state) {
      state.action = state.sequence[state.next];
      state.command = null;
    },
    next: "goalVisible",
  },
  goalVisible: {
    condition: (mgr, state) =>
      !!state.action?.fl && mgr.getVisible(state.action.fl),
    trueCond: "rootNext",
    falseCond: "rotate",
  },
  rotate: {
    exec(mgr, state) {
      state.command = {
        n: "turn",
        v: "90",
      };
    },
    next: "sendCommand",
  },
  rootNext: {
    condition(mgr, state) {
      return state.action!.act == ACTION.FL;
    },
    trueCond: "flagSeek",
    falseCond: "ballSeek",
  },
  flagSeek: {
    condition(mgr, state) {
      return !!state.action?.fl && 3 > mgr.getDistance(state.action!.fl);
    },
    trueCond: "closeFlag",
    falseCond: "farGoal",
  },
  closeFlag: {
    exec(mgr, state) {
      state.next++;
      state.action = state.sequence[state.next];
    },
    next: "root",
  },
  farGoal: {
    condition: (mgr, state) => {
      if (state.action?.fl) {
        const angle = mgr.getAngle(state.action.fl);
        if (angle) return angle > 4;
      }
      return false;
    },
    trueCond: "rotateToGoal",
    falseCond: "runToGoal",
  },
  rotateToGoal: {
    exec(mgr, state) {
      if (state.action?.fl) {
        const angle = mgr.getAngle(state.action.fl);
        if (angle)
          state.command = {
            n: "turn",
            v: angle,
          };
      }
    },
    next: "sendCommand",
  },
  runToGoal: {
    exec(mgr, state) {
      state.command = {
        n: "dash",
        v: 70,
      };
    },
    next: "sendCommand",
  },
  sendCommand: {
    command: (mgr, state) => state.command as unknown as ICommand,
  },

  ballSeek: {
    condition: (mgr, state) =>
      !!state.action?.fl && 0.5 > mgr.getDistance(state.action.fl),
    trueCond: "closeBall",
    falseCond: "farGoal",
  },
  closeBall: {
    condition: (mgr, state) =>
      !!state.action?.goal && mgr.getVisible(state.action.goal!),
    trueCond: "ballGoalVisible",
    falseCond: "ballGoalInvisible",
  },
  ballGoalVisible: {
    exec(mgr, state) {
      if (!!state.action?.goal) {
        state.command = {
          n: "kick",
          v: `100 ${mgr.getAngle(state.action.goal)}`,
        };
      }
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
};
