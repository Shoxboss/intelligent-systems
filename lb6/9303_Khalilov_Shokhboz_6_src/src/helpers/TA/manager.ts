import { ICommand, IMessage } from "../../interfaces";
import { ITransitionAutomaton, ITaken, Edge } from "./interfaces";
import Taken from "./taken";

const BEFORE_ACTION = "beforeAction";
export type IPInputType = [number, ...Exclude<IMessage["p"][0], number>[]];

interface Manager {
  log?: boolean;
  lastTime?: number;
  setHear(input: IPInputType): void;
  getAction(
    input: IPInputType,
    ta: ITransitionAutomaton,
    team: string,
    side: string,
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

  getAction(input, ta, team, side, log) {
    this.log = log;
    let taken = Taken.setSee(input, team, side);

    if (this.log) console.log("TAKEN = ", taken);

    this.incTimers(taken, ta);

    if (ta.actions[BEFORE_ACTION]) {
      ta.actions[BEFORE_ACTION](taken.state, ta.state);
    }

    return this.execute(taken, ta);
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
      return ta.actions[cond](taken.state, ta.state) as ICommand;
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
    
    let node = ta.nodes[ta.current];
    for (let name of node.e) {
      
      let edgeName = `${node.n}_${name}`;
      let edge = ta.edges[edgeName];
      if (!edge) throw `Unexpected edge: ${node.n}_${name}`;
      for (let e of edge) {
        
        if (e.guard) {
          
          let guard = true;
          for (let g of e.guard)
            if (!this.guard(taken, ta, g)) {
              guard = false;
              break; 
            }
          if (!guard)
            
            continue;
        }
        if (e.synch) {
          
          if (e.synch.endsWith("?")) {
            
            let cond = e.synch.substring(0, e.synch.length - 1);
            if (!ta.actions[cond]) throw `Unexpected synch: ${e.synch}`;
            if (this.log) console.log(`Synch[${taken.state.time}]: ${e.synch}`);
            if (!ta.actions[cond](taken.state, ta.state)) continue; 
          }
        }
        ta.current = edgeName; 
        ta.state.next = false;
        return this.execute(taken, ta); 
      }
    }
  },
  nextEdge(taken, ta) {
    
    let arr = ta.current.split("_");
    
    let node = arr[1];
    ta.current = node;
    ta.state.next = false;
    return this.execute(taken, ta); 
  },
  executeState(taken, ta) {
    
    let node = ta.nodes[ta.current];
    if (ta.actions[node.n]) {
      
      let action = ta.actions[node.n](taken.state, ta.state);
      if (!action && ta.state.next) return this.execute(taken, ta);
      return action  as ICommand;
    } else {
      
      ta.state.next = true;
      return this.execute(taken, ta); 
    }
  },
  executeEdge(taken, ta) {
    
    let edges = ta.edges[ta.current];

    for (let e of edges) {
      
      if (e.guard) {
        
        let guard = true;
        for (let g of e.guard)
          if (!this.guard(taken, ta, g)) {
            guard = false;
            break; 
          }
        if (!guard) continue; 
      }

      if (e.assign) {
        
        for (let a of e.assign) {
          if (a.type == "timer") {
            
            if (!ta.state.timers[a.n] && ta.state.timers[a.n] !== 0)
              throw `Unexpected timer: ${JSON.stringify(a)}`;
            ta.state.timers[a.n] = a.v;
          } else {
            
            if (!ta.state.variables[a.n] && ta.state.variables[a.n] !== 0)
              throw `Unexpected variable: ${a}`;
            ta.state.variables[a.n] = a.v;
          }
        }
      }
      if (e.synch) {
        
        if (!e.synch.endsWith("?") && !e.synch.endsWith("!"))
          throw `Unexpected synch: ${e.synch}`;
        if (e.synch.endsWith("!")) {
          
          let cond = e.synch.substring(0, e.synch.length - 1);
          if (!ta.actions[cond]) throw `Unexpected synch: ${e.synch}`;
          if (this.log) console.log(`Synch[${taken.state.time}]: ${e.synch}`);
          
          let result = ta.actions[cond](taken.state, ta.state);
          if (!result) {
            ta.state.next = true;
            return this.execute(taken, ta); 
          }
          return result as ICommand;
        }
      }
    }
    ta.state.next = true; 
    return this.execute(taken, ta); 
  },
  guard(taken, ta, g) {
    
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
};

export default Manager;
