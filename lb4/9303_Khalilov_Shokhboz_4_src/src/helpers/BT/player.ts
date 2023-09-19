import { ICommand, IDecisionTree, IManager, IState } from "../interfaces";

export const PlayerDT: IDecisionTree = {
  state: {
    leader: "p",
    command: null,
  } as IState,
  root: {
    exec(mgr: IManager, state: IState) {
      state.command = null;
    },
    next: "playerVisible",
  },
  playerVisible: {
    condition: (mgr: IManager, state: IState) => mgr.getVisible(state.leader!),
    trueCond: "playerSeek",
    falseCond: "rotate",
  },
  rotate: {
    exec(mgr: IManager, state: IState) {
      state.command = {
        n: "turn",
        v: "90",
      };
    },
    next: "sendCommand",
  },
  playerSeek: {
    condition: (mgr: IManager, state: IState) => {
      if (state.leader && mgr.getDistance(state.leader) < 1) {
        const angle = mgr.getAngle(state.leader);
        return angle !== null && Math.abs(angle) < 40;
      }
      return false;
    },
    trueCond: "closePlayer",
    falseCond: "farPlayer",
  },
  closePlayer: {
    exec(mgr: IManager, state: IState) {
      state.command = {
        n: "turn",
        v: "30",
      };
    },
    next: "sendCommand",
  },
  farPlayer: {
    condition: (mgr, state) => mgr.getDistance(state.leader) > 10,
    trueCond: "bigAngleToPlayer",
    falseCond: "notSoFarPlayer",
  },
  bigAngleToPlayer: {
    condition: (mgr, state) => {
      const angle = mgr.getAngle(state.leader);

      return angle !== null && angle > 5;
    },
    trueCond: "turnToPlayer",
    falseCond: "runToPlayer",
  },
  turnToPlayer: {
    exec(mgr: IManager, state: IState) {
      state.command = {
        n: "turn",
        v: String(mgr.getAngle(state.leader!)),
      };
    },
    next: "sendCommand",
  },
  runToPlayer: {
    exec(mgr: IManager, state: IState) {
      state.command = {
        n: "dash",
        v: "100",
      };
    },
    next: "sendCommand",
  },
  notSoFarPlayer: {
    condition: (mgr: IManager, state: IState) => {
      const angle = mgr.getAngle(state.leader);

      return angle !== null && (angle > 40 || angle < 25);
    },
    trueCond: "turnToPlayerMinus30",
    falseCond: "closeDistToPlayer",
  },
  turnToPlayerMinus30: {
    exec(mgr: IManager, state: IState) {
      const angle = mgr.getAngle(state.leader);
      if (angle)
        state.command = {
          n: "turn",
          v: String(angle - 30),
        };
    },
    next: "sendCommand",
  },
  closeDistToPlayer: {
    condition: (mgr: IManager, state: IState) =>
      mgr.getDistance(state.leader!) < 7,
    trueCond: "smallDashPlayer",
    falseCond: "bigDashPlayer",
  },
  smallDashPlayer: {
    exec(mgr: IManager, state: IState) {
      state.command = {
        n: "dash",
        v: "20",
      };
    },
    next: "sendCommand",
  },
  bigDashPlayer: {
    exec(mgr: IManager, state: IState) {
      state.command = {
        n: "dash",
        v: "40",
      };
    },
    next: "sendCommand",
  },
  sendCommand: {
    command: (mgr: IManager, state: IState) =>
      state.command as unknown as ICommand,
  },
};
