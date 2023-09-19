import { ICommand, IMessage } from "../../interfaces";
import { ITransitionAutomaton, ITaken, Edge } from "./interfaces";
import Taken from "./taken";

const BEFORE_ACTION = "beforeAction";
export type IPInputType = [number, ...Exclude<IMessage["p"][0], number>[]];

interface Manager {
  reset(): unknown;
  log?: boolean;
  is_reset: boolean;
  lastTime?: number;
  setHear(input: IPInputType): void;
  getAction(
    input: IPInputType,
    ta: ITransitionAutomaton,
    data: {
      team: string;
      id: number;
      side: string;
      type: string;
      def_pos: {
        x: number;
        y: number;
      };
    },
    log: boolean
  ): ICommand | undefined;
  incTimers(taken: ITaken, ta: ITransitionAutomaton): void;
  execute(taken: ITaken, ta: ITransitionAutomaton): ICommand | undefined;
  nextState(taken: ITaken, ta: ITransitionAutomaton): ICommand | undefined;
  nextEdge(taken: ITaken, ta: ITransitionAutomaton): ICommand | undefined;
  executeState(taken: ITaken, ta: ITransitionAutomaton): ICommand | undefined;
  executeEdge(taken: ITaken, ta: ITransitionAutomaton): ICommand | undefined;
  guard(
    taken: ITaken,
    ta: ITransitionAutomaton,
    g: Required<Edge>["guard"][0]
  ): boolean;
}

const Manager: Manager = {
  setHear(input): void {
    Taken.setHear(input);
  },

  getAction(input, ta, { team, id, side, type, def_pos }, log) {
    this.log = log;
    let taken = Taken.setSee(input, team, side);

    if (this.log) console.log("TAKEN = ", taken);

    this.incTimers(taken, ta);

    ta.state.local.team = team;
    ta.state.local.side = side;
    ta.state.local.id = id;
    ta.state.local.type = type;
    ta.state.local.def_pos = def_pos;

    if (ta.actions[BEFORE_ACTION]) {
      ta.actions[BEFORE_ACTION](taken.state, ta.state);
    }

    if (this.is_reset) {
      ta.current === "init";
      this.is_reset = false;
    }

    const command = this.execute(taken, ta);

    return command;
  },

  incTimers(taken: any, ta: ITransitionAutomaton) {
    if (!this.lastTime) {
      this.lastTime = 0;
    }
    if (taken.time > this.lastTime) {
      this.lastTime = taken.time;
      for (let key in ta.state.timers) {
        ta.state.timers[key] = ta.state.timers[key] + 1;
      }
    }
  },

  execute(taken, ta) {
    if (this.log) console.log("CURRENT ", ta.current);

    if (ta.state.synch) {
      let cond = ta.state.synch.substring(0, ta.state.synch.length - 1);
      const command = ta.actions[cond](taken.state, ta.state) as ICommand;

      return command;
    }
    if (ta.state.next) {
      if (ta.nodes[ta.current]) {
        return this.nextState(taken, ta);
      }
      if (ta.edges[ta.current]) {
        return this.nextEdge(taken, ta);
      }
    }
    if (ta.nodes[ta.current]) {
      return this.executeState(taken, ta);
    }
    if (ta.edges[ta.current]) {
      return this.executeEdge(taken, ta);
    }
    throw `Unexpected state: ${ta.current}`;
  },
  nextState(taken, ta) {
    // Находимся в узле, нужен переход
    let node = ta.nodes[ta.current];
    for (let name of node.e) {
      // Перебираем ребра
      let edgeName = `${node.n}_${name}`;
      let edge = ta.edges[edgeName];
      if (!edge) throw `Unexpected edge: ${node.n}_${name}`;
      for (let e of edge) {
        // Проверяем все ребра
        if (e.guard) {
          // Проверяем ограничения
          let guard = true;
          for (let g of e.guard)
            if (!this.guard(taken, ta, g)) {
              guard = false;
              break; // Ограничение не выполнено
            }
          if (!guard)
            // Ребро нам не подходит
            continue;
        }
        if (e.synch) {
          // Необходима синхронизация
          if (e.synch.endsWith("?")) {
            // Проверка условия
            let cond = e.synch.substring(0, e.synch.length - 1);
            if (!ta.actions[cond]) throw `Unexpected synch: ${e.synch}`;
            if (this.log) console.log(`Synch[${taken.state.time}]: ${e.synch}`);
            if (!ta.actions[cond](taken.state, ta.state)) continue; // Проверка не успешна
          }
        }
        ta.current = edgeName; // Далее работаем с этим ребром
        ta.state.next = false;
        return this.execute(taken, ta); // Рекурсивный вызов
      }
    }
  },
  nextEdge(taken, ta) {
    // Находимся в ребре, нужен переход
    let arr = ta.current.split("_");
    // После подчеркивания - имя узла, куда должны попасть
    let node = arr[1];
    ta.current = node;
    ta.state.next = false;
    return this.execute(taken, ta); // Рекурсивный вызов
  },
  executeState(taken, ta) {
    // Выполнить действия в узле
    let node = ta.nodes[ta.current];
    if (ta.actions[node.n]) {
      // Если действие в узле есть
      let action = ta.actions[node.n](taken.state, ta.state);
      if (!action && ta.state.next) return this.execute(taken, ta);
      return action as ICommand;
    } else {
      // Если действия в узле нет
      ta.state.next = true;
      return this.execute(taken, ta); // Рекурсивный вызов
    }
  },
  executeEdge(taken, ta) {
    // Выполнить действия в ребре
    let edges = ta.edges[ta.current];

    for (let e of edges) {
      // Может быть несколько ребер
      if (e.guard) {
        // Выбираем "наше" ребро
        let guard = true;
        for (let g of e.guard)
          if (!this.guard(taken, ta, g)) {
            guard = false;
            break; // Ограничение не выполнено
          }
        if (!guard) continue; // Ребро нам не подходит
      }

      if (e.assign) {
        // Есть назначения в ребре
        for (let a of e.assign) {
          if (a.type == "timer") {
            // Для таймеров
            if (!ta.state.timers[a.n] && ta.state.timers[a.n] !== 0)
              throw `Unexpected timer: ${JSON.stringify(a)}`;
            ta.state.timers[a.n] = a.v;
          } else {
            // Для переменных
            if (!ta.state.variables[a.n] && ta.state.variables[a.n] !== 0)
              throw `Unexpected variable: ${a}`;
            ta.state.variables[a.n] = a.v;
          }
        }
      }
      if (e.synch) {
        // Необходима синхронизация
        if (!e.synch.endsWith("?") && !e.synch.endsWith("!"))
          throw `Unexpected synch: ${e.synch}`;
        if (e.synch.endsWith("!")) {
          // Выполнение действия
          let cond = e.synch.substring(0, e.synch.length - 1);
          if (!ta.actions[cond]) throw `Unexpected synch: ${e.synch}`;
          if (this.log) console.log(`Synch[${taken.state.time}]: ${e.synch}`);
          // Выполнение action
          let result = ta.actions[cond](taken.state, ta.state);
          if (!result) {
            ta.state.next = true;
            return this.execute(taken, ta); // Рекурсивный вызов
          }
          return result as ICommand;
        }
      }
    }
    ta.state.next = true; // Действий нет, переход к узлу
    return this.execute(taken, ta); // Рекурсивный вызов
  },
  guard(taken, ta, g) {
    // Проверка условий
    function taStateObject(
      o: { v: string | number; t: string | number },
      ta: {
        state: {
          variables: { [x: string]: any };
          timers: { [x: string]: any };
        };
      }
    ) {
      /* Получение значения
      таймера/переменной (g.l или g.r) */
      if (typeof o == "object")
        return o.v
          ? Number(ta.state.variables[o.v])
          : Number(ta.state.timers[o.t]);
      else return o;
    }

    const comparison: {
      [key: string]: (
        ta: ITransitionAutomaton,
        l: unknown,
        r: unknown
      ) => boolean;
    } = {
      eq(ta: ITransitionAutomaton, l: any, r: any) {
        return taStateObject(l, ta) == taStateObject(r, ta);
      },
      lt(ta: ITransitionAutomaton, l: any, r: any) {
        return taStateObject(l, ta) < taStateObject(r, ta);
      },
      lte(ta: ITransitionAutomaton, l: any, r: any) {
        return taStateObject(l, ta) <= taStateObject(r, ta);
      },
    };

    if (!comparison[g.s]) throw `Unexpected guard: ${JSON.stringify(g)}`;
    return comparison[g.s](ta, g.l, g.r);
  },
  is_reset: false,

  reset() {
    this.is_reset = true;
  },
};

export default Manager;
