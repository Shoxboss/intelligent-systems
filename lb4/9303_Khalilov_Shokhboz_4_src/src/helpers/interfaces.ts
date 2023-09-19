import { IMsgP } from "./../msg";
import { IAction } from "./actions";

export interface ICommand {
  n: string;
  v: string | number;
}

export interface IState {
  next: number;
  leader: string;
  sequence: Pick<IAction, "act" | "fl" | "goal" | "text">[];
  action: Pick<IAction, "act" | "fl" | "goal" | "text"> | null;
  command: ICommand | null;
  isGoal: boolean;
  isHeardGo: boolean;
  teammateCoords: Array<{
    pos: { x: number; y: number };
    angle: number;
  }>;
}

export interface IManager<DT extends IDecisionTree = IDecisionTree> {
  p: IMsgP[];
  getVisible: (fl: string) => boolean;
  getDistance: (fl: string) => number;
  getAngle: (fl: string) => number | null;
  getAction: (dt: DT, p: any[]) => ICommand | null;
  getMyPos: () => number[] | null;
  getTeammatePos: (team: string) => { x: number; y: number } | null;
  getAngleToPass: (
    pos: Array<{
      pos: { x: number; y: number };
      angle: number;
    }>
  ) => number;
}

export interface IStateTransition<S extends IState = IState> {
  condition: (mgr: IManager, state: S) => boolean;
  trueCond: string;
  falseCond: string;
}

export interface IStateAction<S extends IState = IState> {
  exec: (mgr: IManager, state: S) => void;
  next: string;
}

export interface ICommandGenerator<S extends IState = IState> {
  command: (mgr: IManager, state: S) => ICommand | null;
}

export interface IDecisionTree<S extends IState = IState> {
  state: S;
  [key: string]:
    | IStateTransition<S>
    | IStateAction<S>
    | ICommandGenerator<S>
    | S;
}
