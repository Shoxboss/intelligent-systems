import { ICommand } from "../../interfaces";
import { ITransitionAutomaton } from "./interfaces";

const TransitionAutomaton: ITransitionAutomaton = {
  current: "start", // Текущее состояние автомата
  state: {
    // Описание состояния
    variables: {
      dist: Infinity,
      isMiniKick: false,
    }, // Переменные
    timers: {
      t: 0,
    }, // Таймеры
    next: true, // Нужен переход на следующее состояние
    synch: undefined, // Текущее действие
    local: {
      goalie: true,
      catch: 0,
    }, // Внутренние переменные для методов
  },
  nodes: {
    /* Узлы автомата, в каждом узле: имя и узлы, на кото-
     рые есть переходы */
    start: {
      n: "start",
      e: ["action", "rotate"],
    },
    action: {
      n: "action",
      e: ["rotateToBall", "close", "near", "far"],
    },
    rotateToBall: {
      n: "rotateToBall",
      e: ["action"],
    },
    rotate: {
      n: "rotate",
      e: ["start"],
    },
    close: {
      n: "close",
      e: ["catch"],
    },
    catch: {
      n: "catch",
      e: ["kick"],
    },
    kick: {
      n: "kick",
      e: ["kick", "start"],
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
  },
  edges: {
    action_close: [
      {
        guard: [
          {
            s: "lt",
            l: {
              v: "dist",
            },
            r: 2,
          },
        ],
      },
    ],
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
    rotateToBall_action: [{}],
    action_rotateToBall: [
      {
        synch: "isBigAngle?",
      },
    ],
    start_rotate: [{}],
    rotate_start: [{}],
    action_near: [
      {
        guard: [
          {
            s: "lt",
            l: {
              v: "dist",
            },
            r: 15,
          },
          {
            s: "lte",
            l: 2,
            r: {
              v: "dist",
            },
          },
        ],
      },
    ],
    action_far: [
      {
        guard: [
          {
            s: "lte",
            l: 15,
            r: {
              v: "dist",
            },
          },
        ],
      },
    ],
    close_catch: [
      {
        synch: "catch!",
      },
    ],

    catch_kick: [
      {
        synch: "kick!",
      },
    ],
    kick_kick: [
      {
        guard: [
          {
            s: "lt",
            l: {
              v: "dist",
            },
            r: 2,
          },
          {
            s: "eq",
            l: {
              v: "isMiniKick",
            },
            r: true,
          },
        ],
      },
    ],
    kick_start: [
      {
        synch: "goBack!",
        assign: [
          {
            n: "t",
            v: 0,
            type: "timer",
          },
        ],
      },
    ],
    far_start: [
      {
        guard: [
          {
            s: "lt",
            l: 10,
            r: {
              t: "t",
            },
          },
        ],
        synch: "lookAround!",
        assign: [
          {
            n: "t",
            v: 0,
            type: "timer",
          },
        ],
      },
      {
        guard: [
          {
            s: "lte",
            l: {
              t: "t",
            },
            r: 10,
          },
        ],
        synch: "ok!",
      },
    ],
    near_start: [
      {
        synch: "ok!",
        assign: [
          {
            n: "t",
            v: 0,
            type: "timer",
          },
        ],
      },
    ],
    near_intercept: [
      {
        synch: "canIntercept?",
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
  },
  actions: {
    beforeAction(taken, state) {
      state.variables["dist"] = Infinity;
      if (taken.ball) {
        // предыдущее положение мяча
        taken["ballPrev"] = taken.ball;
        state.variables.dist = taken.ball.dist;
      }
      return undefined;
    },
    isBigAngle(taken, state) {
      state.next = true;
      return (
        state.variables.angle !== undefined &&
        Math.abs(state.variables.angle) > 4
      );
    },
    isBallVisible(taken, state) {
      state.next = true;
      return Boolean(taken.ball);
    },
    isBallInvisible(taken, state) {
      state.next = true;
      return !Boolean(taken.ball);
    },
    rotateToBall(taken, state) {
      state.next = true;
      return {
        n: "turn",
        v: state.variables.angle,
      } as ICommand;
    },
    rotate(taken, state) {
      state.next = true;
      return {
        n: "turn",
        v: "90",
      };
    },
    catch(taken, state) {
      // Ловим мяч
      if (taken.ball) {
        let angle = taken.ball.angle;
        let dist = taken.ball.dist;
        state.next = false;
        if (dist && dist > 0.5) {
          if (state.local.goalie && dist < 0.8) {
            if (state.local.catch < 1) {
              state.local.catch++;
              return {
                n: "catch",
                v: angle,
              };
            } else state.local.catch = 0;
          }
          if (angle && Math.abs(angle) > 15)
            return {
              n: "turn",
              v: angle,
            };
          return {
            n: "dash",
            v: 30,
          };
        }
        state.next = true;
      } else {
        state.next = true;
        if (taken.ballPrev)
          return {
            n: "turn",
            v: taken.ballPrev.angle,
          };
      }
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
    goBack(taken, state) {
      // Возврат к воротам
      state.next = false;
      state.local.look = undefined;
      let goalOwn = taken.goalOwn;
      if (!goalOwn?.angle)
        return {
          n: "turn",
          v: 60,
        };
      if (Math.abs(goalOwn.angle) > 10)
        return {
          n: "turn",
          v: goalOwn.angle,
        };
      if (goalOwn?.dist && goalOwn.dist < 2) {
        state.next = true;
        return {
          n: "turn",
          v: 180,
        };
      }
      return {
        n: "dash",
        v: goalOwn?.dist! * 2 + 40,
      };
    },
    lookAround(taken, state) {
      // Осматриваемся
      state.next = false;
      state.synch = "lookAround!";

      if (!state.local.look) {
        if (!taken?.lookAroundFlags?.fprc) return { n: "turn", v: 90 };
        state.local.look = "left";
        return { n: "turn", v: taken.lookAroundFlags.fprc.angle };
      }

      switch (state.local.look) {
        case "left":
          if (!taken?.lookAroundFlags?.fprc) return { n: "turn", v: 90 };
          if (
            taken?.lookAroundFlags?.fprc?.angle &&
            Math.abs(taken?.lookAroundFlags?.fprc?.angle) > 8
          )
            return { n: "turn", v: taken.lookAroundFlags.fprc.angle };
          state.local.look = "center";
          return {
            n: "turn",
            v: -90,
          };
        case "center":
          state.local.look = "right";
          return {
            n: "turn",
            v: 90,
          };

        case "right":
          state.local.look = "back";
          return {
            n: "turn",
            v: 90,
          };
        case "back":
          state.local.look = "left";
          state.next = true;
          state.synch = undefined;
          return {
            n: "turn",
            v: -90,
          };
        default:
          state.next = true;
      }
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
    runToBall(taken, state) {
      // Бежим к мячу
      state.next = false;
      let ball = taken.ball;
      if (!ball) {
        return {
          n: "turn",
          v: 90,
        };
      }
      if (ball.dist && ball.dist >= 15) return this.goBack(taken, state);
      if (ball.dist && ball.dist < 2) {
        state.next = true;
        return {
          n: "turn",
          v: ball.angle,
        };
      }
      if (ball?.angle && Math.abs(ball.angle) > 10)
        return {
          n: "turn",
          v: ball.angle,
        };
      return {
        n: "dash",
        v: (ball.dist ?? 0) * 5 + 50,
      };
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
    empty(taken, state) {
      state.next = true;
      return undefined;
    }, // Пустое действие
  },
};

export default TransitionAutomaton;
