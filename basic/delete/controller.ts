import { HearSender } from "./enums/HearSender";
import { IHearResponse, IPoint, ISeeData } from "../src/interfaces";
import { SenseBody } from "../src/interfaces/senseBody";

export interface ISeeResponse {
  time: number;
  opponents: IPlayer[];
  comrades: IPlayer[];
  flags: Record<string, Flag>;
  goals: Record<string, Goal>;
  ball?: Ball;
  self?: IPoint & { team: string };
  lines: Record<string, Line>;
}

export interface IPlayer {
  teamName: string;
  unum: number;
  x: number;
  y: number;
  dist: number;
  dir: number;
  bodyAngle: number;
  neckAngle: number;
}

interface Flag {
  x: number;
  y: number;
  dist: number;
  dir: number;
}

interface Goal {
  teamName: string;
  side: GoalSide;
  x: [number, number];
  y: [number, number];
  dist: number;
  dir: number;
}

interface Ball {
  dist: number;
  dir: number;
  distChange?: number;
  dirChange?: number;
  x: number;
  y: number;
}

interface Line {
  dist?: number;
  dir?: number;
  x: [number, number];
  y: [number, number];
}

enum FlagType {
  P = "P", // Penalty mark
  p = "p", // Player mark
  C = "c", // Center mark
  G = "g", // Goal post
  GL = "gl", // Goal line
  GR = "gr", // Goal line
  FTL = "ftl", // Field touch line
  FTR = "ftr", // Field touch line
  FBL = "fbl", // Field touch line
  FBR = "fbr", // Field touch line
  TL = "tl", // Top touch line
  TR = "tr", // Top touch line
  BL = "bl", // Bottom touch line
  BR = "br", // Bottom touch line
  B = "b", // Ball
  T = "t", // Flag placed on a target position
}

enum GoalSide {
  L = "l",
  R = "r",
}

enum LineType {
  L = "l",
  W = "w",
}

export class Controller {
  public parseInitResponse(response: string) {
    const regex = /\(init\s(\w+)\s([\d\-\.]+)\s(\w+)\)/gm;
    const match = response.match(regex);
    if (!match) {
      throw new Error(`Failed to parse init response: ${response}`);
    }
    const teamNumber = parseInt(match[1]);
    const rawTeamNames = match[2];
    const teamNames = rawTeamNames.split(" ");
    return {
      teamNumber,
      teamNames,
    };
  }

  public parseHearResponse(response: string): IHearResponse | null {
    const regex = /^hear ([\d\.]+) (\w+) (.+)$/;

    const match = response.match(regex);

    if (match) {
      const time = parseInt(match[1]);
      const sender = match[2] as HearSender;
      const message = match[3];

      return { time, sender, message };
    } else {
      return null;
    }
  }

  public parseSeeResponse(data: string, ourTeamName: string): ISeeResponse {
    data = data.slice(0, data.length - 1);
    data = data.replaceAll(") (", ")|(");
    let data_array = data.split("|");
    const [, time, ...first] = data_array[0].split(" ");

    data_array[0] = first.join(" ");

    const result = {
      time,
      flags: {},
      lines: {},
      goals: {},
      opponents: [] as unknown as IPlayer[],
      comrades: [] as unknown as IPlayer[],
      ball: undefined as any,
    };

    for (const _str of data_array) {
      switch (_str.slice(2, 3)) {
        case "f":
          result.flags = {
            ...result.flags,
            ...parseFlag(_str),
          };
          break;

        case "g":
          result.goals = {
            ...parseGoal(_str),
            ...result.goals,
          };
          break;
        case "F":
          break;
        case "b":
          result["ball"] = parseBall(_str);
          break;
        case "p":
          const player = parsePlayer(_str);

          if (player) {
            if (ourTeamName === player.teamName) {
              result.comrades.push(player as unknown as IPlayer);
            } else {
              result.opponents.push(player as unknown as IPlayer);
            }
          }
          break;
        case "l":
          result.lines = {
            ...parseLine(_str),
            ...result.lines,
          };
          break;
        default:
          break;
      }
    }

    return result as unknown as ISeeResponse;
  }

  public getAllPossibleCoordinates(flags: Flag[]) {
    // const flags = data.flags;
    // const keys = Object.keys(flags);
    const n = flags.length;

    if (n >= 3) {
      const p1 = flags[0];
      const p2 = flags[1];
      const p3 = flags[2];

      const d1 = p1.dist;
      const d2 = p2.dist;
      const d3 = p3.dist;

      const y1 = p1.y;
      const y2 = p2.y;
      const y3 = p3.y;

      const x1 = p1.x;
      const x2 = p2.x;
      const x3 = p3.x;

      let coordinates: [number, number][] = [];

      if (x1 === x2) {
        const m = (y3 - y2) / (x3 - x2);
        const b = y2 - m * x2;

        const a = 1;
        const b1 = -2 * y1;
        const c = y1 ** 2 + (x1 - b) ** 2 - d1 ** 2;

        const delta = b1 ** 2 - 4 * a * c;

        if (delta < 0) {
          return coordinates;
        } else if (delta === 0) {
          const x = -b1 / (2 * a);
          coordinates = [[x, m * x + b]];
        } else {
          const x1 = (-b1 + Math.sqrt(delta)) / (2 * a);
          const x2 = (-b1 - Math.sqrt(delta)) / (2 * a);
          coordinates = [
            [x1, m * x1 + b],
            [x2, m * x2 + b],
          ];
        }
      } else if (x1 === x3) {
        const m = (y2 - y3) / (x2 - x3);
        const b = y3 - m * x3;

        const a = 1;
        const b1 = -2 * y1;
        const c = y1 ** 2 + (x1 - b) ** 2 - d1 ** 2;

        const delta = b1 ** 2 - 4 * a * c;

        if (delta < 0) {
          return coordinates;
        } else if (delta === 0) {
          const x = -b1 / (2 * a);
          coordinates = [[x, m * x + b]];
        } else {
          const x1 = (-b1 + Math.sqrt(delta)) / (2 * a);
          const x2 = (-b1 - Math.sqrt(delta)) / (2 * a);
          coordinates = [
            [x1, m * x1 + b],
            [x2, m * x2 + b],
          ];
        }
      } else if (x2 === x3) {
        const m = (y1 - y3) / (x1 - x3);
        const b = y3 - m * x3;

        const a = 1;
        const b1 = -2 * y2;
        const c = y2 ** 2 + (x2 - b) ** 2 - d2 ** 2;

        const delta = b1 ** 2 - 4 * a * c;

        if (delta < 0) {
          return coordinates;
        } else if (delta === 0) {
          const x = -b1 / (2 * a);
          coordinates = [[x, m * x + b]];
        } else {
          const x1 = (-b1 + Math.sqrt(delta)) / (2 * a);
          const x2 = (-b1 - Math.sqrt(delta)) / (2 * a);
          coordinates = [
            [x1, m * x1 + b],
            [x2, m * x2 + b],
          ];
        }
      } else {
        const m1 = (y2 - y1) / (x2 - x1);
        const b1 = y1 - m1 * x1;

        const m2 = (y3 - y1) / (x3 - x1);
        const b2 = y1 - m2 * x1;

        const a = 1 + m1 ** 2 - m2 ** 2;
        const b1_2 = 2 * (m1 * b1 - m2 * b2) - 2 * x1 + 2 * m2 * x1;
        const c =
          x1 ** 2 +
          b1 ** 2 -
          d1 ** 2 -
          2 * b1 * b2 +
          b2 ** 2 +
          x1 ** 2 * m2 ** 2 -
          2 * x1 * b2 * m2;

        const delta = b1_2 ** 2 - 4 * a * c;

        if (delta < 0) {
          return coordinates;
        } else if (delta === 0) {
          const x = -b1_2 / (2 * a);
          coordinates = [[x, m1 * x + b1]];
        } else {
          const x1 = (-b1_2 + Math.sqrt(delta)) / (2 * a);
          const x2 = (-b1_2 - Math.sqrt(delta)) / (2 * a);
          coordinates = [
            [x1, m1 * x1 + b1],
            [x2, m1 * x2 + b1],
          ];
        }
      }

      return coordinates;
    } else if (n === 2) {
      const p1 = flags[0];
      const p2 = flags[1];

      const d = this.distance(p1, p2);

      if (d === p1.dist + p2.dist) {
        return [
          [p1.x, p1.y],
          [p2.x, p2.y],
        ];
      } else if (d === Math.abs(p1.dist - p2.dist)) {
        const p = p1.dist < p2.dist ? p1 : p2;
        return [[p.x, p.y]];
      } else if (d < p1.dist + p2.dist && d > Math.abs(p1.dist - p2.dist)) {
        const a = (p1.dist ** 2 - p2.dist ** 2 + d ** 2) / (2 * d);
        const h = Math.sqrt(p1.dist ** 2 - a ** 2);

        const x = p1.x + (a / d) * (p2.x - p1.x);
        const y = p1.y + (a / d) * (p2.y - p1.y);

        const pa = [x + (h / d) * (p2.y - p1.y), y - (h / d) * (p2.x - p1.x)];
        const pb = [x - (h / d) * (p2.y - p1.y), y + h / d];
      }
    }

    if (n >= 2) {
      const p1 = flags[0];
      const p2 = flags[1];

      const d1 = p1.dist;
      const d2 = p2.dist;

      const y1 = p1.y;
      const y2 = p2.y;

      const x1 = p1.x;
      const x2 = p2.x;

      if (x2 === x1) {
        const y = (y2 ** 2 - y1 ** 2 + d1 ** 2 - d2 ** 2) / (2 * (y2 - y1));

        const xArray = [
          x1 + Math.sqrt(d1 ** 2 - (y - y1) ** 2),
          x1 - Math.sqrt(d1 ** 2 - (y - y1) ** 2),
        ];

        return [
          [xArray[0], y],
          [xArray[1], y],
        ];
      }
      if (y1 === y2) {
        const x = (x2 ** 2 - x1 ** 2 + d1 ** 2 - d2 ** 2) / (2 * (x2 - x1));

        const yArray = [
          y1 + Math.sqrt(d1 ** 2 - (x - x1) ** 2),
          y1 - Math.sqrt(d1 ** 2 - (x - x1) ** 2),
        ];

        return [
          [x, yArray[0]],
          [x, yArray[1]],
        ];
      }
      const alpha = (y1 - y2) / (x2 - x1);
      const betta =
        (y2 ** 2 - y1 ** 2 + x2 ** 2 - x1 ** 2 + d1 ** 2 - d2 ** 2) /
        (2 * (x2 - x1));

      const a = alpha ** 2 + 1;
      const b = 2 * (alpha * (x1 - betta) + y1);
      const c = (x1 - betta) ** 2 + y1 ** 2 - d1 ** 2;

      const discriminant = b ** 2 - 4 * a * c;
      if (discriminant < 0) {
        return null;
      }

      const yArray = [
        (-b + Math.sqrt(discriminant)) / (2 * a),
        (-b - Math.sqrt(discriminant)) / (2 * a),
      ];

      const xArray = [
        x1 + Math.sqrt(d1 ** 2 - (yArray[0] - y1) ** 2),
        x1 - Math.sqrt(d1 ** 2 - (yArray[0] - y1) ** 2),
        x1 + Math.sqrt(d1 ** 2 - (yArray[1] - y1) ** 2),
        x1 - Math.sqrt(d1 ** 2 - (yArray[1] - y1) ** 2),
      ];

      let coordinates = [
        [xArray[0], yArray[0]],
        [xArray[1], yArray[0]],
        [xArray[2], yArray[1]],
        [xArray[3], yArray[1]],
      ];

      return coordinates as [number, number][];
    }
    return null;
  }

  public getMostProbableCoordinates(
    data: ISeeResponse,
    coordinates: number[][]
  ) {
    if (data.lines) {
      const { r, l, b, t } = data.lines;

      const distX = r?.dist || l?.dist;
      const distY = t?.dist || b?.dist;
      const x = r?.x[0] | l?.x[0];
      const y = t?.y[0] | b?.y[0];
      const px = x - distX!;
      const py = y - distY!;

      if (!isNaN(px)) {
        coordinates = coordinates.filter(([x, y]) => Math.abs(px - x) < 1);
      }

      if (!isNaN(py)) {
        coordinates = coordinates.filter(([x, y]) => Math.abs(py - y) < 1);
      }
    }

    if ("c" in data.flags && data.goals && "r" in data.goals) {
      coordinates = coordinates.filter(([x, y]) => x < 0);
    } else if ("c" in data.flags && data.goals && "l" in data.goals) {
      coordinates = coordinates.filter(([x, y]) => x > 0);
    }

    return coordinates.at(0);
  }

  public getPosition(flags: Flag[]) {
    const data = tryTakeThreeFlags(flags);

    if (data.length >= 3) {
      const p1 = data[0];
      const p2 = data[1];
      const p3 = data[2];

      const y1 = p1.y;
      const y2 = p2.y;
      const y3 = p3.y;

      const x1 = p1.x;
      const x2 = p2.x;
      const x3 = p3.x;

      if (y1 === y2 && y2 === y3) {
        if (x1 === x2 && x2 === x3) {
        } else if (x1 === x2 || x1 === x3 || x2 === x3) {
          if (x1 === x2) {
          } else if (x3 === x2) {
          } else {
          }
        } else {
        }
      } else if (y1 === y2 || y1 === y3 || y2 === y3) {
        if (y1 === y2) {
          if (x1 === x2 && x2 === x3) {
          } else if (x1 === x2 || x1 === x3 || x2 === x3) {
            if (x1 === x2) {
            } else if (x3 === x2) {
            } else {
            }
          } else {
          }
        } else if (y3 === y2) {
          if (x1 === x2 && x2 === x3) {
          } else if (x1 === x2 || x1 === x3 || x2 === x3) {
            if (x1 === x2) {
            } else if (x3 === x2) {
            } else {
            }
          } else {
          }
        } else {
          if (x1 === x2 && x2 === x3) {
          } else if (x1 === x2 || x1 === x3 || x2 === x3) {
            if (x1 === x2) {
            } else if (x3 === x2) {
            } else {
            }
          } else {
          }
        }
      } else {
        if (x1 === x2 && x2 === x3) {
        } else if (x1 === x2 || x1 === x3 || x2 === x3) {
          if (x1 === x2) {
            // const res1 = findByTwoFlags(p1, p3);
            // const res2 = findByTwoFlags(p2, p3);
            // console.log(res1, res2);
            // return res1;
          } else if (x3 === x2) {
            // const res1 = findByTwoFlags(p1, p3);
            // const res2 = findByTwoFlags(p1, p2);
            // console.log(res1, res2);
          } else {
            // const res1 = findByTwoFlags(p2, p3);
            // const res2 = findByTwoFlags(p1, p2);
          }
        } else {
          return [findByThreeFlags(p1, p2, p3)];
        }
      }
    } else if (data.length >= 2) {
      // return findByTwoFlags(data[0], data[1]);
    }

    return null;
  }

  static area: [IPoint, IPoint] = [
    { x: -52.5, y: -34 },
    { x: 52.5, y: 34 },
  ];

  public isInArea(position: IPoint): boolean {
    if (!position) {
      return false;
    }

    const [bottomLeft, topRight] = Controller.area;
    return (
      position.x > bottomLeft.x &&
      position.x < topRight.x &&
      position.y > bottomLeft.y &&
      position.y < topRight.y
    );
  }

  public parseSenseBodyResponse(message: string): SenseBody | null {
    const regex = /\(([\w\s\-\.\d]+)\)/g;

    if (message.startsWith("(sense_body ")) {
      const matches = message.matchAll(regex);

      const result = {
        senseBody: {},
      } as SenseBody;

      for (const match of matches) {
        if (match[1]) {
          const [key, ...values] = match[1].split(" ");

          (result.senseBody as { [key: string]: unknown })[key] =
            values.length === 1 ? parseFloat(values[0]) : values;
        }
      }

      return result;
    }

    return null;
  }
  public distance(p1: IPoint, p2: IPoint) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  findTurnAngle(x1: number, y1: number, x2: number, y2: number): number {
    const targetX = x2 - x1;
    const targetY = y2 - y1;
    if (targetX === 0 && targetY === 0) {
      return 0;
    }
    const angle = Math.atan(targetY / targetX);
    return targetX < 0 ? angle + Math.PI : angle;
  }
}

function parseFlag(msg: string) {
  const regex =
    /\(\(f ([\w\d\s]+)\)\s([\d\-\.]+)\s([\d\-\.]+)\s?([\d\-\.]+)?\s?([\d\-\.]+)?\)/i;
  const match = msg.match(regex);
  if (match) {
    const [, flag, dist, dir] = match;
    const key = flag.replaceAll(" ", "");

    return {
      [key]: {
        dir: parseFloat(dir),
        dist: parseFloat(dist),
        ...getFlagPosition(key),
      },
    };
  }
}

function parseLine(msg: string) {
  const regex = /\(\(l ([\w\d\s]+)\)\s([\d\-\.]+)\s([\d\-\.]+)\)/i;
  const match = msg.match(regex);
  if (match) {
    const [, flag, dist, dir] = match;
    const key = flag.replaceAll(" ", "");
    return {
      [key]: {
        dir: parseFloat(dir),
        dist: parseFloat(dist),
        ...getLinePosition(key),
      },
    };
  }
}

function parsePlayer(msg: string) {
  const regex =
    /\(\(p\s\"(\w+)\"\s?(\d+)?\)\s([\d\-\.]+)\s([\d\-\.]+)\s([\d\-\.]+)\s([\d\-\.]+)\s([\d\-\.]+)\s([\d\-\.]+)/;

  const match = msg.match(regex);
  if (match) {
    const [, teamName, unum, dist, dir, distChange, dirChange, x, y] = match;
    return {
      teamName,
      unum: parseFloat(unum ?? "-1"),
      dist: parseFloat(dist),
      dir: parseFloat(dir),
      distChange: parseFloat(distChange),
      dirChange: parseFloat(dirChange),
      x: parseFloat(x),
      y: parseFloat(y),
    };
  }
}
function parseGoal(msg: string) {
  const regex = /\(\(g\s(\w)\)\s([\d\-\.]+)\s([\d\-\.]+)\)/;
  const match = msg.match(regex);
  if (match) {
    const [, flag, dist, dir] = match;
    return {
      [flag]: {
        dir: parseFloat(dir),
        dist: parseFloat(dist),
        ...getGoalPosition(flag),
      },
    };
  }
}

function parseBall(msg: string) {
  const regex = /\(\(b\) ([\d\-\.]+) ([\d\-\.]+) ([\d\-\.]+) ([\d\-\.]+)\)/;
  const match = msg.match(regex);
  if (match) {
    const [, dist, dir, distChange, dirChange] = match;
    return {
      dir: parseFloat(dir),
      dist: parseFloat(dist),
      distChange: parseFloat(distChange),
      dirChange: parseFloat(dirChange),
      ...getBallPosition(parseFloat(dist), parseFloat(dir)),
    };
  }
}

function getBallPosition(dist: number, dir: number) {
  const dirRad = (dir * Math.PI) / 180; // convert to radians

  const xPos = dist * Math.cos(dirRad);
  const yPos = dist * Math.sin(dirRad);

  return { x: xPos, y: yPos };
}

export function getFlagPosition(key: string): Record<"x" | "y", number> {
  const flags: Record<string, Record<"x" | "y", number>> = {
    tl50: { x: -50, y: 39 },
    tl40: { x: -40, y: 39 },
    tl30: { x: -30, y: 39 },
    tl20: { x: -20, y: 39 },
    tl10: { x: -10, y: 39 },
    t0: { x: 0, y: 39 },
    tr10: { x: 10, y: 39 },
    tr20: { x: 20, y: 39 },
    tr30: { x: 30, y: 39 },
    tr40: { x: 40, y: 39 },
    tr50: { x: 50, y: 39 },
    bl50: { x: -50, y: -39 },
    bl40: { x: -40, y: -39 },
    bl30: { x: -30, y: -39 },
    bl20: { x: -20, y: -39 },
    bl10: { x: -10, y: -39 },
    b0: { x: 0, y: -39 },
    br10: { x: 10, y: -39 },
    br20: { x: 20, y: -39 },
    br30: { x: 30, y: -39 },
    br40: { x: 40, y: -39 },
    br50: { x: 50, y: -39 },
    lt30: { x: -57.5, y: 30 },
    lt20: { x: -57.5, y: 20 },
    lt10: { x: -57.5, y: 10 },
    l0: { x: -57.5, y: 0 },
    lb10: { x: -57.5, y: -10 },
    lb20: { x: -57.5, y: -20 },
    lb30: { x: -57.5, y: -30 },
    rt30: { x: 57.5, y: 30 },
    rt20: { x: 57.5, y: 20 },
    rt10: { x: 57.5, y: 10 },
    r0: { x: 57.5, y: 0 },
    rb10: { x: 57.5, y: -10 },
    rb20: { x: 57.5, y: -20 },
    rb30: { x: 57.5, y: -30 },
    plt: { x: -36, y: 20.15 },
    plc: { x: -36, y: 0 },
    plb: { x: -36, y: -20.15 },
    prt: { x: 36, y: 20.15 },
    prc: { x: 36, y: 0 },
    prb: { x: 36, y: -20.15 },
    rt: { x: 52.5, y: 34 },
    lt: { x: -52.5, y: 34 },
    ct: { x: 0, y: 34 },
    rb: { x: 52.5, y: -34 },
    lb: { x: -52.5, y: -34 },
    cb: { x: 0, y: -34 },
    grt: { x: 52.5, y: 7.01 },
    grb: { x: 52.5, y: -7.01 },
    glt: { x: -52.5, y: 7.01 },
    glb: { x: -52.5, y: -7.01 },
    gl: { x: -52.5, y: 0 },
    gr: { x: 52.5, y: 0 },
    c: { x: 0, y: 0 },
  };
  return flags[key];
}

function getLinePosition(key: string) {
  const lines: Record<
    string,
    {
      x: [number, number];
      y: [number, number];
    }
  > = {
    r: {
      x: [52.5, 52.5],
      y: [34, -34],
    },
    l: {
      x: [-52.5, -52.5],
      y: [34, -34],
    },
    b: {
      x: [-52.5, 52.5],
      y: [-34, -34],
    },
    t: {
      x: [-52.5, 52.5],
      y: [34, 34],
    },
  };

  return lines[key];
}

function getGoalPosition(key: string) {
  const goals: Record<
    string,
    {
      x: [number, number];
      y: [number, number];
    }
  > = {
    r: {
      x: [52.5, 52.5],
      y: [3.5, -3.5],
    },
    l: {
      x: [-52.5, -52.5],
      y: [3.5, -3.5],
    },
  };

  return goals[key];
}

function tryTakeThreeFlags(flags: Flag[]) {
  const head: Flag[] = [];
  const tail: Flag[] = [];

  for (const flag of flags) {
    const i = head.findIndex(({ x, y }) => flag.x === x || flag.y === y);
    if (i === -1) {
      head.push(flag);
    } else {
      tail.push(flag);
    }
  }
  return [...head, ...tail];
}

function findByThreeFlags(p1: Flag, p2: Flag, p3: Flag) {
  const d1 = p1.dist;
  const d2 = p2.dist;
  const d3 = p3.dist;

  const y1 = p1.y;
  const y2 = p2.y;
  const y3 = p3.y;

  const x1 = p1.x;
  const x2 = p2.x;
  const x3 = p3.x;

  const alpha = {
    _1: (y1 - y2) / (x2 - x1),
    _2: (y1 - y3) / (x3 - x1),
  };
  const betta = {
    _1:
      (y2 ** 2 - y1 ** 2 + x2 ** 2 - x1 ** 2 + d1 ** 2 - d2 ** 2) /
      (2 * (x2 - x1)),
    _2:
      (y3 ** 2 - y1 ** 2 + x3 ** 2 - x1 ** 2 + d1 ** 2 - d3 ** 2) /
      (2 * (x3 - x1)),
  };

  const y = (betta._1 - betta._2) / (alpha._2 - alpha._1);
  const x = alpha._1 * y + betta._1;

  return [x, y];
}

export function findThirdSide(a: number, b: number) {
  // Use the Pythagorean theorem to find the length of the third side
  const c = Math.sqrt(a ** 2 + b ** 2);

  return c;
}

export function findObjectPosition(
  p3: {
    x: number;
    y: number;
  },
  p2: {
    x: number;
    y: number;
    dist: number;
    dir: number;
  },
  target: {
    dist: number;
    dir: number;
  }
) {



    if (
      p1.dir === target.dir &&
      Math.floor(Math.abs(target.dist - p1.dist)) === 0
    ) {
      return [p1.x, p1.y];
    } else if (
      p2.dir === target.dir &&
      Math.floor(Math.abs(target.dist - p2.dist)) === 0
    ) {
      return [p2.x, p2.y];
    }

    const _p1 = {
      x: p1.x,
      y: p1.y,
      dir: p1.dir,
      dist: findThirdSide(p1.dist, target.dist),
    };

    const _p2 = {
      x: p2.x,
      y: p2.y,
      dir: p2.dir,
      dist: findThirdSide(p2.dist, target.dist),
    };

    const _p3 = {
      x: p3.x,
      y: p3.y,
      dist: target.dist,
      dir: target.dir,
    };

    return findByThreeFlags(_p1, _p2, _p3);
  }
}
