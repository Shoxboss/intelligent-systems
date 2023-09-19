import { IDecisionTree, IManager } from "./../interfaces";
const FL = "flag",
  PS = "pass",
  ST = "stop",
  SAY = "say";
const TEAM = "RMA";
const START_COORD = "-12 -15";
const NUMBER_GOAL_PLAYER = 2;
export const PassDT: IDecisionTree = {
  state: {
    next: 0,
    sequence: [
      { act: FL, fl: "fplc" },
      { act: PS, fl: "b" },
      { act: SAY, text: "go" },
      { act: FL, fl: "fplc" },
      { act: ST },
    ],
    action: null,
    command: null,
    teammateCoords: [],
    leader: "p",
    isGoal: false,
    isHeardGo: false,
  },
  root: {
    exec: function (mgr, state) {
      state.action = state.sequence[state.next];
      state.command = null;
    },
    next: "checkStop",
  },
  checkStop: {
    condition: function (mgr, state) {
      return !!state.action && state.action.act === ST;
    },
    trueCond: "startOrStay",
    falseCond: "checkSay",
  },
  checkSay: {
    condition: function (mgr, state) {
      return !!state.action && state.action.act === SAY;
    },
    trueCond: "say",
    falseCond: "goalVisible",
  },
  say: {
    exec: function (mgr, state) {
      state.command = {
        n: "say",
        v: state.action?.text ?? "",
      };
      state.next++;
      state.action = state.sequence[state.next];
    },
    next: "sendCommand",
  },
  startOrStay: {
    condition: (mgr, state) => {
      return !!state.isGoal;
    },
    trueCond: "goToStart",
    falseCond: "sendCommand",
  },
  goToStart: {
    exec: function (mgr, state) {
      state.command = {
        n: "move",
        v: START_COORD,
      };
    },
    next: "sendCommand",
  },
  goalVisible: {
    condition: function (mgr, state) {
      return !!state.action?.fl && mgr.getVisible(state.action.fl);
    },
    trueCond: "rootNext",
    falseCond: "rotate",
  },
  rotate: {
    exec: function (mgr, state) {
      state.command = {
        n: "turn",
        v: "45",
      };
    },
    next: "sendCommand",
  },
  rootNext: {
    condition: function (mgr, state) {
      return !!state.action?.act && state.action.act === FL;
    },
    trueCond: "flagSeek",
    falseCond: "ballSeek",
  },
  flagSeek: {
    condition: function (mgr, state) {
      return !!state.action?.fl && 3 > mgr.getDistance(state.action.fl);
    },
    trueCond: "closeFlag",
    falseCond: "farGoal",
  },
  closeFlag: {
    exec: function (mgr, state) {
      state.next++;
      state.action = state.sequence[state.next];
    },
    next: "root",
  },
  farGoal: {
    condition: function (mgr, state) {
      if (state.action?.fl) {
        const angle = mgr.getAngle(state.action.fl);
        if (angle) {
          return angle > 4;
        }
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
        v: 60,
      };
    },
    next: "sendCommand",
  },
  ballSeek: {
    condition: (mgr, state) =>
      !!state.action?.fl && 1 > mgr.getDistance(state.action.fl),
    trueCond: "closeBall",
    falseCond: "farGoal",
  },
  closeBall: {
    condition: (mgr, state) =>
      mgr.getVisible(`p"${TEAM}"`) ||
      mgr.getVisible(`p"${TEAM}"${NUMBER_GOAL_PLAYER}`),
    trueCond: "checkPlayerCoords",
    falseCond: "playerInvisible",
  },
  checkPlayerCoords: {
    condition: (mgr, state) =>
      !!state.teammateCoords && state.teammateCoords.length > 1,
    trueCond: "kick",
    falseCond: "updateTeammateCoords",
  },
  updateTeammateCoords: {
    exec(mgr, state) {
      const pos = mgr.getTeammatePos(TEAM);
      const angle =
        mgr.getAngle(`p"${TEAM}"`) === null
          ? mgr.getAngle(`p"${TEAM}"${NUMBER_GOAL_PLAYER}`)
          : mgr.getAngle(`p"${TEAM}"`);

      if (pos && angle) {
        state.teammateCoords.push({
          pos,
          angle,
        });
      }
    },
    next: "sendCommand",
  },
  kick: {
    exec(mgr, state) {
      state.command = {
        n: "kick",
        v: `100 ${mgr.getAngleToPass(state.teammateCoords)}`,
      };
      state.teammateCoords = [];
      state.next++;
      state.action = state.sequence[state.next];
    },
    next: "sendCommand",
  },
  playerInvisible: {
    exec(mgr, state) {
      state.command = {
        n: "kick",
        v: `10 45`,
      };
    },
    next: "sendCommand",
  },
  sendCommand: {
    command: (mgr, state) => state.command,
  },
};
