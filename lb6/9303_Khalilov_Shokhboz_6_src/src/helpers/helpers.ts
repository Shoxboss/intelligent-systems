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

  
  const angleToTeammate = Math.atan2(dy, dx);

  
  const angleDiff = angleToTeammate - teammate.dir;

  
  const speed = Math.max(0, teammate.dist - teammate.distChange);

  
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
  
  const futureX = teammate.x + teammate.dist * Math.cos(teammate.dir);
  const futureY = teammate.y + teammate.dist * Math.sin(teammate.dir);

  
  const dx = futureX;
  const dy = futureY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  
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
  

  const distance = teammate.dist;
  const angleToTeammate = teammate.dir;

  
  const angleToMoveTo = angleToTeammate + (distance + 18) * teammate.dirChange;
  const power = Math.min(100, 4 * distance);

  return { angle: angleToMoveTo, power };
}
