import { ICommand } from "../../interfaces";
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
      e: ["start", "initTargetVisble", "init"],
    },
    initTargetVisble: {
      n: "initTargetVisble",
      e: ["init"],
    },
    start: {
      n: "start",
      e: ["action", "rotate"],
    },
    rotate: {
      n: "rotate",
      e: ["start"],
    },
    close: {
      n: "close",
      e: ["kickHard"],
    },
    makePass: {
      n: "makePass",
      e: ["start"],
    },
    far: {
      n: "far",
      e: ["start"],
    },
    near: {
      n: "near",
      e: ["intercept", "start"],
    },
    intercept: {
      n: "intercept",
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
    /* Рёбра автомата (имя каждого ребра указывает на
         узел-источник и узел-приёмник) */
    init_initTargetVisble: [
      {
        synch: "initTargetVisble?",
      },
    ],
    close_makePass: [
      {
        synch: "forwardsVisible?",
      },
    ],
    initTargetVisble_init: [
      {
        synch: "initRotate!",
      },
    ],
    init_start: [
      {
        synch: "init?",
      },
    ],
    init_init: [
      {
        synch: "dash!",
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
    action_start: [
      {
        synch: "isBallInvisible?",
      },
    ],

    makePass_start: [
      {
        synch: "makePass!",
      },
    ],
    intercept_start: [
      {
        synch: "runToBall!",
        assign: [
          {
            n: "t",
            v: 0,
            type: "timer",
          },
        ],
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
      {
        synch: "inZone?",
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

    initTargetVisble(taken, state) {
      state.next = true;

      if (taken.side && taken.side === "l") {
        return !Boolean(
          taken.lookAroundFlags?.fprc ||
            taken.lookAroundFlags?.fprc ||
            taken.lookAroundFlags?.fprt
        );
      } else {
        return !Boolean(
          taken.lookAroundFlags?.fplc ||
            taken.lookAroundFlags?.fplc ||
            taken.lookAroundFlags?.fplt
        );
      }
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
    canIntercept(taken, state) {
      // Можем добежать первыми
      let _ball = taken.ball;
      if (!_ball) return false;
      const ball = _ball;

      let ballPrev = taken.ballPrev;
      state.next = true;

      if (taken.teamEnemy) {
        const enemy = taken.teamEnemy.find((enemy) => {
          let degrees =
            Math.sign(enemy.angle) === Math.sign(ball.angle)
              ? Math.max(Math.abs(enemy.angle), Math.abs(ball.angle)) -
                Math.min(Math.abs(enemy.angle), Math.abs(ball.angle))
              : Math.abs(enemy.angle) + Math.abs(ball.angle);
          const enemyDistanceToBall = Math.sqrt(
            enemy.dist ** 2 +
              ball.dist ** 2 -
              2 * enemy.dist * ball.dist * Math.cos((degrees * Math.PI) / 180)
          );
          return enemyDistanceToBall < ball.dist;
        });
        return !Boolean(enemy);
      }
      if (!ballPrev) return true;
      if (ball.dist <= ballPrev.dist + 0.5) return true;
      return false;
    },
    init(taken, state) {
      state.next = true;
      if (taken.my_pos) {
        const { x } = taken.my_pos;

        if (taken.side && taken.side == "l") {
          return Math.abs(x + 36) <= 5;
        }

        return Math.abs(x - 36) <= 5;
      }
      // dist to line r < 20
      return false;
    },
    dash(taken, state) {
      state.next = true;
      return {
        n: "dash",
        v: "90",
      };
    },
    initRotate(taken, state) {
      state.next = true;
      let angle = 45;
      if (taken.side && taken.side === "l") {
        angle =
          (taken.lookAroundFlags?.fprb?.angle ||
            taken.lookAroundFlags?.fprt?.angle ||
            taken.lookAroundFlags?.fprc?.angle) ??
          45;
      }
      if (taken.side && taken.side === "r") {
        angle =
          (taken.lookAroundFlags?.fplc?.angle ||
            taken.lookAroundFlags?.fplc?.angle ||
            taken.lookAroundFlags?.fplt?.angle) ??
          45;
      }
      return {
        n: "turn",
        v: angle,
      };
    },
    rotate(taken, state) {
      state.next = true;
      return {
        n: "turn",
        v: "90",
      };
    },
    forwardsVisible(taken, state) {
      const teamOwn = taken
        .closest("++")
        .sort((t1, t2) => t1.coords.x - t2.coords.x);

      if (teamOwn.length > 0) {
        state.local.targetToPass = {
          dist: teamOwn[0].dist,
          x: teamOwn[0].coords.x,
          y: teamOwn[0].coords.y,
        };
        return true;
      }
      return false;
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
      if (state.variables.dist && state.variables.dist >= 0.5) {
        return {
          n: "dash",
          v: 40,
        };
      }
      const angle = taken.goal?.angle ?? 45;

      return {
        n: "kick",
        v: `30 ${angle}`,
      };
    },

    fewTeammates(taken, state) {
      state.next = true;

      const closets = taken.closest("+++");

      const filterd = closets.filter(
        (item) => item.dist < taken.ball!.dist + 1
      );

      console.log("defender", taken.my_pos, taken.side, taken.ball);

      if (taken.ball?.x) {
        if (taken.side === "l") {
          return taken.ball.dist > 15 || taken.ball.x > 0;
        }
        return taken.ball.dist > 15 || taken.ball.x < 0;
      }

      if (taken.my_pos) {
        const { x } = taken.my_pos;

        if (taken.side === "l") {
          return x < 0;
        } else {
          return x > 0;
        }
      }

      if (taken.ball && taken.ball.dist > 15) {
        return false;
      }

      return filterd.length < 2;
    },
    kick(taken, state) {
      // Пинаем мяч
      state.next = true;
      if (taken.ball) {
        let dist = taken.ball.dist;
        let angle = taken.ball.angle;
        if (dist && dist <= 0.5) {
          let goal = taken.goal;
          let player = taken.teamOwn ? taken.teamOwn[0] : null;
          let target;
          if (goal?.dist && player?.dist) {
            target = goal.dist < player.dist ? goal : player;
          } else if (goal) {
            target = goal;
          } else if (player) {
            target = player;
          }
          if (target?.dist) {
            state.variables.isMiniKick = false;
            return {
              n: "kick",
              v: `${target.dist * 2 + 40} ${target.angle}`,
            };
          }
          state.next = false;
          state.variables.isMiniKick = true;
          let kickAngle =
            taken.botFlagsCount &&
            taken.topFlagsCount &&
            taken.botFlagsCount > taken.topFlagsCount
              ? 45
              : -45;
          return {
            n: "kick",
            v: `10 ${kickAngle}`,
          };
        } else {
          if (angle && Math.abs(angle) > 10)
            return {
              n: "turn",
              v: angle,
            };
          return {
            n: "dash",
            v: (dist ?? 0) * 5 + 40,
          };
        }
      } else if (state.variables.isMiniKick) {
        if (taken.ballPrev) {
          return {
            n: "turn",
            v: taken.ballPrev.angle,
          };
        }
      }
    },
    makePass(taken, state) {
      state.next = true;

      const target = state.local.targetToPass as {
        dist: number;
        dir: number;
        x: number;
        y: number;
      };
      const volume = target.dist + 50;
      if (taken.my_pos) {
        let angle = angleOf(taken.my_pos, target);
        console.log(taken.side, target, angle, taken.my_pos);
        return {
          n: "kick",
          v: `${volume} ${angle}`,
        };
      }
    },
  },
};

export default TransitionAutomaton;
