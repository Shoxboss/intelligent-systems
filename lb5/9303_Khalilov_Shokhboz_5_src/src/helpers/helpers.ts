import { IPoint } from "../interfaces";

export function dist(p1: IPoint, p2: IPoint) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
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

export function inZone(
  pos: { x: number; y: number },
  side: "l" | "r",
  type:
    | "GK"
    | "CB"
    | "LB"
    | "RB"
    | "LM"
    | "RM"
    | "CM"
    | "LF"
    | "RF"
    | "CF"
    | string
) {
  const zones: {
    l: Record<string, [{ x: number; y: number }, { x: number; y: number }]>;
    r: Record<string, [{ x: number; y: number }, { x: number; y: number }]>;
  } = {
    l: {
      GK: [
        { x: 35, y: 20 },
        { x: 52.5, y: -20 },
      ],
      CB: [
        { x: 0, y: 20 },
        { x: 50, y: -20 },
      ],
      LB: [
        { x: 0, y: -35 },
        { x: 52.5, y: -10 },
      ],
      RB: [
        { x: 0, y: 10 },
        { x: 52.5, y: 35 },
      ],
      LM: [
        { x: -25, y: -10 },
        { x: 25, y: -35 },
      ],
      RM: [
        { x: -25, y: 10 },
        { x: 25, y: 35 },
      ],
      CM: [
        { x: -25, y: -20 },
        { x: 25, y: 20 },
      ],
      LF: [
        { x: -52.5, y: -35 },
        { x: -10, y: -10 },
      ],
      RF: [
        { x: -52.5, y: 35 },
        { x: -10, y: 10 },
      ],
      CF: [
        { x: -52.5, y: -20 },
        { x: -10, y: 20 },
      ],
    },
    r: {
      GK: [
        { x: -35, y: -20 },
        { x: -52.5, y: 20 },
      ],
      CB: [
        { x: 0, y: 20 },
        { x: -50, y: -20 },
      ],
      LB: [
        { x: 0, y: -10 },
        { x: -52.5, y: -35 },
      ],
      RB: [
        { x: 0, y: 10 },
        { x: -52.5, y: 35 },
      ],
      LM: [
        { x: 25, y: -10 },
        { x: -25, y: -35 },
      ],
      RM: [
        { x: 25, y: 10 },
        { x: -25, y: 35 },
      ],
      CM: [
        { x: 25, y: -20 },
        { x: -25, y: 20 },
      ],
      LF: [
        { x: 52.5, y: -35 },
        { x: 10, y: -10 },
      ],
      RF: [
        { x: 52.5, y: 35 },
        { x: 10, y: 10 },
      ],
      CF: [
        { x: 52.5, y: -20 },
        { x: 10, y: 20 },
      ],
    },
  };

  return isInRect(pos, zones[side][type]);
}

function isInRect(
  p: { x: number; y: number },
  [tl, br]: [{ x: number; y: number }, { x: number; y: number }]
) {
  const [min_x, max_y] = [Math.min(tl.x, br.x), Math.max(tl.y, br.y)];
  const [max_x, min_y] = [Math.max(tl.x, br.x), Math.min(tl.y, br.y)];

  return p.x >= min_x && p.x <= max_x && p.y >= min_y && p.y <= max_y;
}
