import { ICommand } from "../../interfaces";
import { ITransitionAutomaton } from "./interfaces";

const TransitionAutomaton: ITransitionAutomaton = {
  current: "start",
  state: {
    variables: {
      dist: undefined,
      angle: undefined,
    },
    timers: {
      t: 0,
    },
    next: true,
    synch: undefined,
    local: {},
  },
  nodes: {
    /* Узлы автомата, в каждом узле: имя и узлы, на кото-
       рые есть переходы */
    start: {
      n: "start",
      e: ["action", "rotate"],
    },
    rotate: {
      n: "rotate",
      e: ["start"],
    },
    action: {
      n: "action",
      e: ["start", "goalCheck", "rotateToBall", "runToBall"],
    },
    rotateToBall: {
      n: "rotateToBall",
      e: ["action"],
    },
    runToBall: {
      n: "runToBall",
      e: ["action"],
    },
    goalCheck: {
      n: "goalCheck",
      e: ["start", "kickHard", "kickWeak"],
    },
    kickHard: {
      n: "kickHard",
      e: ["start"],
    },
    kickWeak: {
      n: "kickWeak",
      e: ["goalCheck"],
    },
  },
  edges: {
    start_rotate: [{}],
    rotate_start: [{}],
    start_action: [
      {
        synch: "isBallVisible?",
      },
    ],
    action_start: [
      {
        synch: "isBallInvisible?",
      },
    ],
    action_goalCheck: [
      {
        guard: [
          {
            s: "lt",
            l: {
              v: "dist",
            },
            r: 0.5,
          },
        ],
      },
    ],
    action_rotateToBall: [
      {
        synch: "isBigAngle?",
      },
    ],
    rotateToBall_action: [{}],
    action_runToBall: [
      {
        synch: "space?",
      },
    ],
    runToBall_action: [
      {
        synch: "runToBall!",
      },
    ],
    goalCheck_start: [
      {
        synch: "isBallInvisible?",
      },
    ],
    goalCheck_kickHard: [
      {
        synch: "isGoalVisible?",
      },
    ],
    kickHard_start: [{}],
    goalCheck_kickWeak: [{}],
    kickWeak_goalCheck: [{}],
  },
  actions: {
    beforeAction(taken, state): boolean {
      state.variables.dist = undefined;
      state.variables.angle = undefined;
      if (taken.ball) {
        taken.ballPrev = taken.ball;
        state.variables.dist = taken.ball.dist;
        state.variables.angle = taken.ball.angle;
      }
      return true;
    },
    space(taken, state) {
      if (taken?.closestTeammates) {
        const arr = taken.closestTeammates();
        const filterd = arr.filter(
          (item) => item.dist < (taken.ball?.dist ?? 0)
        );
        console.log(filterd, filterd.length < 2);

        return filterd.length < 2;
      } else {
        console.log(false);
      }

      return false;
    },
    rotate(taken, state) {
      state.next = true;
      return {
        n: "turn",
        v: "90",
      };
    },
    isBallVisible(taken, state) {
      state.next = true;
      return Boolean(taken.ball);
    },
    isBallInvisible(taken, state) {
      state.next = true;
      return !Boolean(taken.ball);
    },
    isBigAngle(taken, state) {
      state.next = true;
      return (
        state.variables.angle !== undefined &&
        Math.abs(state.variables.angle) > 4
      );
    },
    rotateToBall(taken, state) {
      state.next = true;
      return {
        n: "turn",
        v: state.variables.angle,
      } as ICommand;
    },
    runToBall(taken, state) {
      state.next = true;
      return {
        n: "dash",
        v: 100,
      };
    },
    isGoalVisible(taken, state) {
      state.next = true;
      return Boolean(taken.goal);
    },
    kickHard(taken, state) {
      state.next = true;
      return {
        n: "kick",
        v: `100 ${taken.goal!.angle}`,
      };
    },
    kickWeak(taken, state) {
      state.next = true;
      if (
        state.variables.angle !== undefined &&
        Math.abs(state.variables.angle) > 10
      ) {
        return {
          n: "turn",
          v: state.variables.angle,
        };
      }
      if (state.variables.dist && state.variables.dist >= 0.5) {
        return {
          n: "dash",
          v: 40,
        };
      }
      return {
        n: "kick",
        v: "10 45",
      };
    },
  },
};

export default TransitionAutomaton;
