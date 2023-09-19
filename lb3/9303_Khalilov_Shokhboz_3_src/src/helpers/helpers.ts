import { IPoint } from "../interfaces";

export function dist(p1: IPoint, p2: IPoint) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}