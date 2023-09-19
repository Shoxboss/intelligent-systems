import { ICommand, IMessage } from "../../interfaces";
import { IPInputType } from "./manager";

export interface IVariables {
  dist?: number;
  angle?: number;
  isMiniKick?: boolean;
  [key: string]: boolean | number | undefined;
}

export interface Timers {
  t: number;
  [key: string]: number;
}

export interface LocalVariables {
  [key: string]: any;
}

export interface TAState {
  variables: IVariables;
  timers: Timers;
  next: boolean;
  synch?: string;
  local: LocalVariables;
}

export interface INode {
  n: string;
  e: string[];
}

export interface IEdgeAssign {
  n: string;
  v: number;
  type: string;
}

export interface Edge {
  synch?: string;
  assign?: IEdgeAssign[];
  guard?: {
    s: string;
    l: { v: string | number } | { t: string } | number | boolean;
    r: { v: string | number } | { t: string } | number | boolean;
  }[];
}

export interface ITransitionAutomaton {
  current: string;
  state: TAState;
  nodes: { [key: string]: INode };
  edges: { [key: string]: Edge[] };
  actions: Record<
    string,
    (taken: ITakenState, state: TAState) => ICommand | boolean | undefined
  >;
}

export interface ObjectData {
  y?: number;
  x?: number;
  f: string;
  angle: number;
  dist: number;
}

export interface Flags {
  fprb?: ObjectData;
  fprc?: ObjectData;
  fprt?: ObjectData;
  fplb?: ObjectData;
  fplc?: ObjectData;
  fplt?: ObjectData;
}

export interface ITakenState {
  side?: string;
  my_pos?: { x: number; y: number };
  closest: (
    flag: boolean | string
  ) => Array<{ coords: { x: number; y: number }; dist: number }>;
  ballPrev?: ObjectData;
  time?: number;
  ball?: ObjectData;
  goalOwn?: ObjectData;
  goal?: ObjectData;
  lookAroundFlags?: Flags;
  teamOwn: ObjectData[];
  teamEnemy: ObjectData[];
  topFlagsCount?: number;
  botFlagsCount?: number;
}

export interface ITaken {
  state: ITakenState;
  setHear: (input: IPInputType) => void;
  getObjData: (
    input?: Exclude<IMessage["p"][0], number>
  ) => ObjectData | undefined;
  setSee: (input: IPInputType, team: string, side: string) => ITaken;
  getMyPos: (input: IPInputType) => any;
}
