import { IFlagCoords } from "./../constants/flagCoords";
import { IPoint } from "../interfaces";

export function dist(p1: IPoint, p2: IPoint) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

interface IMessage {
  msg: string;
  cmd?: string;
  p: (
    | number
    | {
        p: number[];
        cmd: { p: string[] };
      }
  )[];
}

function theBallIsNear(message: IMessage): boolean {
  for (const obj of message.p) {
    if (typeof obj !== "object" || !obj.cmd || !Array.isArray(obj.cmd.p)) {
      continue;
    }
    const cmdP = obj.cmd.p;
    if (cmdP.length > 0 && cmdP[0] === "b") {
      const ballDistance = message.p[0];
      return ballDistance <= 0.5; // Adjust threshold as needed
    }
  }
  return false;
}

function theBallIsVisible(message: IMessage): boolean {
  for (const obj of message.p) {
    if (typeof obj !== "object" || !obj.cmd || !Array.isArray(obj.cmd.p)) {
      continue;
    }
    const cmdP = obj.cmd.p;
    if (cmdP.length > 0 && cmdP[0] === "b") {
      return true;
    }
  }
  return false;
}

// for example

const msg: IMessage = {
  msg: '(see 0 ((f c) 25 0 0 0) ((f r t) 84.8 -24) ((f r b) 84.8 24) ((f g r b) 77.5 5) ((g r) 77.5 0) ((f g r t) 77.5 -5) ((f p r b) 64.1 18) ((f p r c) 60.9 0) ((f p r t) 64.1 -18) ((f t r 20) 59.7 -41) ((f t r 30) 67.4 -35) ((f t r 40) 75.9 -31) ((f t r 50) 84.8 -27) ((f b r 20) 59.7 41) ((f b r 30) 67.4 35) ((f b r 40) 75.9 31) ((f b r 50) 84.8 27) ((f r 0) 82.3 0) ((f r t 10) 83.1 -7) ((f r t 20) 84.8 -14) ((f r t 30) 87.4 -20) ((f r b 10) 83.1 7) ((f r b 20) 84.8 14) ((f r b 30) 87.4 20) ((b) 24.5 0 -0 0) ((p "FCB" 5) 11 -27 0 0 0 0) ((p "RMA") 40.4 0) ((l r) 77.5 90))',
  p: [
    0,
    { p: [25, 0, 0, 0], cmd: { p: ["f", "c"] } },
    { p: [84.8, -24], cmd: { p: ["f", "r", "t"] } },
    { p: [84.8, 24], cmd: { p: ["f", "r", "b"] } },
    { p: [77.5, 5], cmd: { p: ["f", "g", "r", "b"] } },
    { p: [77.5, 0], cmd: { p: ["g", "r"] } },
    { p: [77.5, -5], cmd: { p: ["f", "g", "r", "t"] } },
    { p: [64.1, 18], cmd: { p: ["f", "p", "r", "b"] } },
    { p: [60.9, 0], cmd: { p: ["f", "p", "r", "c"] } },
    { p: [64.1, -18], cmd: { p: ["f", "p", "r", "t"] } },
    { p: [59.7, -41], cmd: { p: ["f", "t", "r", "20"] } },
    { p: [67.4, -35], cmd: { p: ["f", "t", "r", "30"] } },
    { p: [75.9, -31], cmd: { p: ["f", "t", "r", "40"] } },
    { p: [84.8, -27], cmd: { p: ["f", "t", "r", "50"] } },
    { p: [59.7, 41], cmd: { p: ["f", "b", "r", "20"] } },
    { p: [67.4, 35], cmd: { p: ["f", "b", "r", "30"] } },
    { p: [75.9, 31], cmd: { p: ["f", "b", "r", "40"] } },
    { p: [84.8, 27], cmd: { p: ["f", "b", "r", "50"] } },
    { p: [82.3, 0], cmd: { p: ["f", "r", "0"] } },
    { p: [83.1, -7], cmd: { p: ["f", "r", "t", "10"] } },
    { p: [84.8, -14], cmd: { p: ["f", "r", "t", "20"] } },
    { p: [87.4, -20], cmd: { p: ["f", "r", "t", "30"] } },
    { p: [83.1, 7], cmd: { p: ["f", "r", "b", "10"] } },
    { p: [84.8, 14], cmd: { p: ["f", "r", "b", "20"] } },
    { p: [87.4, 20], cmd: { p: ["f", "r", "b", "30"] } },
    { p: [24.5, 0, 0, 0], cmd: { p: ["b"] } },
    { p: [11, -27, 0, 0, 0, 0], cmd: { p: ["p", '"FCB"', "5"] } },
    { p: [40.4, 0], cmd: { p: ["p", '"RMA"'] } },
    { p: [77.5, 90], cmd: { p: ["l", "r"] } },
  ],
  cmd: "see",
};

const FlagCoords: IFlagCoords = {
  ftl50: { x: -50, y: 39 },
  ftl40: { x: -40, y: 39 },
  ftl30: { x: -30, y: 39 },
  ftl20: { x: -20, y: 39 },
  ftl10: { x: -10, y: 39 },
  ft0: { x: 0, y: 39 },
  ftr10: { x: 10, y: 39 },
  ftr20: { x: 20, y: 39 },
  ftr30: { x: 30, y: 39 },
  ftr40: { x: 40, y: 39 },
  ftr50: { x: 50, y: 39 },
  fbl50: { x: -50, y: -39 },
  fbl40: { x: -40, y: -39 },
  fbl30: { x: -30, y: -39 },
  fbl20: { x: -20, y: -39 },
  fbl10: { x: -10, y: -39 },
  fb0: { x: 0, y: -39 },
  fbr10: { x: 10, y: -39 },
  fbr20: { x: 20, y: -39 },
  fbr30: { x: 30, y: -39 },
  fbr40: { x: 40, y: -39 },
  fbr50: { x: 50, y: -39 },
  flt30: { x: -57.5, y: 30 },
  flt20: { x: -57.5, y: 20 },
  flt10: { x: -57.5, y: 10 },
  fl0: { x: -57.5, y: 0 },
  flb10: { x: -57.5, y: -10 },
  flb20: { x: -57.5, y: -20 },
  flb30: { x: -57.5, y: -30 },
  frt30: { x: 57.5, y: 30 },
  frt20: { x: 57.5, y: 20 },
  frt10: { x: 57.5, y: 10 },
  fr0: { x: 57.5, y: 0 },
  frb10: { x: 57.5, y: -10 },
  frb20: { x: 57.5, y: -20 },
  frb30: { x: 57.5, y: -30 },
  fglt: { x: -52.5, y: 7.01 },
  fglb: { x: -52.5, y: -7.01 },
  fc: { x: 0, y: 0 },
  fplt: { x: -36, y: 20.15 },
  fplc: { x: -36, y: 0 },
  fplb: { x: -36, y: -20.15 },
  fgrt: { x: 52.5, y: 7.01 },
  fgrb: { x: 52.5, y: -7.01 },
  fprt: { x: 36, y: 20.15 },
  fprc: { x: 36, y: 0 },
  fprb: { x: 36, y: -20.15 },
  flt: { x: -52.5, y: 34 },
  fct: { x: 0, y: 34 },
  frt: { x: 52.5, y: 34 },
  flb: { x: -52.5, y: -34 },
  fcb: { x: 0, y: -34 },
  frb: { x: 52.5, y: -34 },
  gl: { x: -52.5, y: 0 },
  gr: { x: 52.5, y: 0 },
};

const GOAL_AREA_WIDTH = 16;
const SIGHT_DISTANCE = 50;
const KICKING_DISTANCE = 0.5;
const FLAG_COORDS = FlagCoords;

function theTeammateIsVisble(message: IMessage, teamname: string): boolean {
  for (const obj of message.p) {
    if (typeof obj !== "object" || !obj.cmd || !Array.isArray(obj.cmd.p)) {
      continue;
    }
    const cmdP = obj.cmd.p;
    if (cmdP.length > 0 && cmdP[0] === "p" && cmdP[1] === teamname) {
      return true;
    }
  }
  return false;
}
export function callculatePlayerMovement(
  player: { x: number; y: number },
  teammate: {
    x: number;
    y: number;
    dist: number;
    dir: number;
    distChange: number;
    dirChange: number;
  }
): { speed: number; direction: number } {
  const dx = teammate.x - player.x;
  const dy = teammate.y - player.y;

  // Calculate the angle between the player and the ball
  const angleToTeammate = Math.atan2(dy, dx);

  // Calculate the difference in angle between the player's direction and the angle to the ball
  const angleDiff = angleToTeammate - teammate.dir;

  // Calculate the player's speed based on their distance to the ball and the ball's distance change
  const speed = Math.max(0, teammate.dist - teammate.distChange);

  // Calculate the player's direction based on the ball's direction and direction change
  const direction = teammate.dir + angleDiff + teammate.dirChange;

  return { speed, direction };
}

interface TeammateData {
  x: number;
  y: number;
  dir: number;
  dist: number;
  distChange: number;
  dirChange: number;
}

interface PassData {
  angle: number;
  power: number;
}

export function calculatePass(teammate: TeammateData): PassData {
  // Calculate the future position of the teammate after the ball has been kicked
  const futureX = teammate.x + teammate.dist * Math.cos(teammate.dir);
  const futureY = teammate.y + teammate.dist * Math.sin(teammate.dir);

  // Calculate the angle and distance between the current position of the player and the future position of the teammate
  const dx = futureX;
  const dy = futureY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Calculate the required kick power based on the distance to the teammate
  const power = 50 + 0.4 * distance;

  return { angle: (angle * 180) / Math.PI, power };
}

export function calculatePassAngleAndPower(
  player: { x: number; y: number },
  teammate: {
    x: number;
    y: number;
    dist: number;
    dir: number;
    distChange: number;
    dirChange: number;
  }
): { angle: number; power: number } {
  // calculate distance and direction to teammate

  const distance = teammate.dist;
  const angleToTeammate = teammate.dir;

  // calculate angle and power for pass
  const angleToMoveTo = angleToTeammate + (distance + 18) * teammate.dirChange;
  const power = Math.min(100, 4 * distance);

  return { angle: angleToMoveTo, power };
}
