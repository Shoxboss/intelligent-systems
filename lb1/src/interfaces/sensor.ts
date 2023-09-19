import { FlagType } from "../enums/FlagType";

export interface IFlag {
  type: FlagType;
  distance: number;
  direction?: number;
  distanceChange?: number;
  directionChange?: number;
}

export interface IBall {
  distance: number;
  direction: number;
  x: number;
  y: number;
}
