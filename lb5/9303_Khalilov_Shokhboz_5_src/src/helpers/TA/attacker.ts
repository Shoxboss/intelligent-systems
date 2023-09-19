import { ICommand } from "../../interfaces";
import { inZone } from "../helpers";
import { angleOf } from "./getCoords";
import { ITransitionAutomaton } from "./interfaces";

const TransitionAutomaton: ITransitionAutomaton = {
  current: "init",
  state: {
    // Описание состояния
    variables: {
      dist: undefined,
      angle: undefined,
    }, // Переменные
    timers: {
      t: 0,
    }, // Таймеры
    next: true, // Нужен переход на следующее состояние
    synch: undefined, // Текущее действие
    local: {}, // Внутренние переменные для методов
  },
  nodes: {
    /* Узлы автомата, в каждом узле: имя и узлы, на кото-
       рые есть переходы */
    init: {
      n: "init",
      e: ["start", "init"],
    },
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
      e: ["start", "goalCheck", "rotateToBall", "runToBall", "ok"],
    },
    backToZone: {
      n: "backToZone",
      e: ["start"],
    },
    ok: {
      n: "ok",
      e: ["start"],
    },
    goBack: {
      n: "goBack",
      e: ["start"],
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
    goBack_start: [
      {
        synch: "",
      },
    ],
    action_goBack: [
      {
        synch: "",
      },
    ],
    ok_start: [
      {
        synch: "ok!",
      },
    ],
    action_ok: [{}],
    init_start: [
      {
        synch: "init?",
      },
    ],
    init_init: [
      {
        synch: "initDash!",
      },
    ],
    start_rotate: [{}],
    rotate_start: [{}],
    /* Список guard описывает перечень условий, проверяемых
     * для перехода по ребру. Знак lt - меньше, lte - меньше
     * либо равно. В качестве параметров принимаются числа или
     * значения переменных "v" или таймеров "t" */
    start_action: [
      {
        synch: "isBallVisible?",
      },
    ],
    action_backToZone: [
      {
        synch: "outZone?",
      },
    ],
    backToZone_start: [
      {
        synch: "inZone?",
      },
      {
        synch: "backToZone!",
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
        synch: "fewTeammates?",
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
      // Действие перед каждым вычислением
      state.variables.dist = undefined;
      state.variables.angle = undefined;
      if (taken.ball) {
        // предыдущее положение мяча
        taken.ballPrev = taken.ball;
        state.variables.dist = taken.ball.dist;
        state.variables.angle = taken.ball.angle;
      }
      return true;
    },
    initTargetAngel(taken, state) {
      state.next = true;

      if (taken.my_pos) {
        const pos = taken.my_pos;
        const def_pos = state.local.def_pos;

        return angleOf(pos, def_pos) > 10;
      }
    },
    init(taken, state) {
      state.next = true;
      if (taken.my_pos) {
        const pos = taken.my_pos;

        const def_pos = state.local.def_pos;

        return distance(pos, def_pos) < 5;
      }
      // dist to line r < 20
      return false;
    },
    initDash(taken, state) {
      state.next = true;
      return {
        n: "dash",
        v: "90",
      };
    },
    initRotate(taken, state) {
      state.next = true;
      if (taken.my_pos) {
        const pos = taken.my_pos;

        const def_pos = state.local.def_pos;

        return {
          n: "turn",
          v: angleOf(pos, def_pos),
        };
      }
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
      // if (this.inZone(taken, state))
      return {
        n: "dash",
        v: 100,
      };
    },
    isGoalVisible(taken, state) {
      state.next = true;
      return !!taken.goal && taken.goal.dist < 25;
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
      const angle = taken.goal?.angle ?? 45;
      return {
        n: "kick",
        v: `10 ${angle}`,
      };
    },

    fewTeammates(taken, state) {
      state.next = true;

      const closets = taken.closest("+++");

      const filterd = closets.filter(
        (item) => item.dist < taken.ball!.dist + 1
      );

      if (taken.ball && taken.ball.dist > 10) {
        return false;
      }

      return filterd.length < 2;
    },
    ok(taken, state) {
      // Ничего делать не надо
      state.next = true;
      if (taken.ball) {
        return { n: "turn", v: taken.ball.angle };
      }
      return {
        n: "turn",
        v: 0,
      };
    },
  },
};

export default TransitionAutomaton;

function distance(p1: { x: number; y: number }, p2: { x: number; y: number }) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}
