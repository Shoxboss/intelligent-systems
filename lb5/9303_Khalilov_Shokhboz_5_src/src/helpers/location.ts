import { IPoint } from "../interfaces";
import { FlagCoords, IFlagCoords } from "./../constants/flagCoords";

function coordsForSeemX(
  p1: IPoint & { dist: number },
  p2: IPoint & { dist: number },
  p3?: IPoint & { dist: number }
) {
  const [x1, y1, d1] = [p1.x, p1.y, p1.dist];
  const [x2, y2, d2] = [p2.x, p2.y, p2.dist];
  const [x3, y3, d3] = [p3?.x, p3?.y, p3?.dist];

  const y = (y2 ** 2 - y1 ** 2 + d1 ** 2 - d2 ** 2) / (2 * (y2 - y1));

  const xs = [];
  xs.push(x1 + Math.sqrt(Math.abs(d1 ** 2 - (y - y1) ** 2)));
  xs.push(x1 - Math.sqrt(Math.abs(d1 ** 2 - (y - y1) ** 2)));
  let answer = null;
  if (d3 && x3 && y3) {
    const forX1 = Math.abs((xs[0] - x3) ** 2 + (y - y3) ** 2 - d3 ** 2);
    const forX2 = Math.abs((xs[1] - x3) ** 2 + (y - y3) ** 2 - d3 ** 2);
    if (forX1 - forX2 > 0) {
      answer = { x: xs[1], y };
    } else {
      answer = { x: xs[0], y };
    }
  } else {
    if (Math.abs(xs[0]) <= 54) {
      answer = { x: xs[0], y };
    } else {
      answer = { x: xs[1], y };
    }
  }
  return answer;
}

function coordsForSeemY(
  p1: IPoint & { dist: number },
  p2: IPoint & { dist: number },
  p3?: IPoint & { dist: number }
) {
  const [x1, y1, d1] = [p1.x, p1.y, p1.dist];
  const [x2, y2, d2] = [p2.x, p2.y, p2.dist];
  const [x3, y3, d3] = [p3?.x, p3?.y, p3?.dist];

  const x = (x2 ** 2 - x1 ** 2 + d1 ** 2 - d2 ** 2) / (2 * (x2 - x1));

  const ys = [];

  ys.push(y1 + Math.sqrt(Math.abs(d1 ** 2 - (x - x1) ** 2)));
  ys.push(y1 - Math.sqrt(Math.abs(d1 ** 2 - (x - x1) ** 2)));

  let answer = null;

  if (x3 && y3 && d3) {
    const forY1 = Math.abs((x - x3) ** 2 + (ys[0] - y3) ** 2 - d3 ** 2);
    const forY2 = Math.abs((x - x3) ** 2 + (ys[1] - y3) ** 2 - d3 ** 2);
    if (forY1 - forY2 > 0) {
      answer = { x, y: ys[1] };
    } else {
      answer = { x, y: ys[0] };
    }
  } else {
    if (Math.abs(ys[0]) <= 32) {
      answer = { x, y: ys[0] };
    } else {
      answer = { x, y: ys[1] };
    }
  }
  return answer;
}

function tryTakeThreeFlags(
  flags: {
    p: number[];
    cmd: { p: string[] };
  }[],
  Flags: IFlagCoords
) {
  const head: (IPoint & { dist: number; dir: number })[] = [];
  const tail: (IPoint & { dist: number; dir: number })[] = [];

  for (const flag of flags) {
    if (flag.cmd?.p?.length > 0) {
      const key = flag.cmd.p.join("");

      if (key && Flags[key]) {
        const { x, y } = Flags[key];
        const [dist, dir] = flag.p;
        const i = head.findIndex((point) => point.x === x || point.y === y);
        if (i === -1) {
          head.push({ x, y, dist, dir });
        } else {
          tail.push({ x, y, dist, dir });
        }
      }
    }
  }
  if (head.length || tail.length) {
    return [...head, ...tail];
  }
  return null;
}

export function getPosition(
  p: {
    p: number[];
    cmd: { p: string[] };
  }[]
) {
  const flags = tryTakeThreeFlags(p, FlagCoords);
  if (flags) {
    if (flags?.length >= 3) {
      return findByThreeFlags(flags[0], flags[1], flags[2]);
    } else if (flags.length >= 2) {
      return findByTwoFlags(flags[0], flags[1]);
    }
  }
  return null;
}

export function findByThreeFlags(
  p1: IPoint & { dist: number },
  p2: IPoint & { dist: number },
  p3: IPoint & { dist: number }
) {
  const [x1, y1, d1] = [p1.x, p1.y, p1.dist];
  const [x2, y2, d2] = [p2.x, p2.y, p2.dist];
  const [x3, y3, d3] = [p3.x, p3.y, p3.dist];
  let answer = null;

  if (p1.x === p2.x) {
    answer = coordsForSeemX(p1, p2, p3);
  } else if (p1.x === p3.x) {
    answer = coordsForSeemX(p1, p3, p2);
  } else if (p2.x === p3.x) {
    answer = coordsForSeemX(p2, p3, p1);
  } else if (p1.y === p2.y) {
    answer = coordsForSeemY(p1, p2, p3);
  } else if (p1.y === p3.y) {
    answer = coordsForSeemY(p1, p3, p2);
  } else if (p2.y === p3.y) {
    answer = coordsForSeemY(p2, p3, p1);
  } else {
    const α1 = (y1 - y2) / (x2 - x1);
    const α2 = (y1 - y3) / (x3 - x1);

    const β1 =
      (y2 ** 2 - y1 ** 2 + x2 ** 2 - x1 ** 2 + d1 ** 2 - d2 ** 2) /
      (2 * (x2 - x1));
    const β2 =
      (y3 ** 2 - y1 ** 2 + x3 ** 2 - x1 ** 2 + d1 ** 2 - d3 ** 2) /
      (2 * (x3 - x1));

    const y = (β1 - β2) / (α2 - α1);
    const x = α1 * y + β1;
    answer = { x, y };
  }

  return answer;
}

export function findThirdSide(side1: number, side2: number): number {
  // check if either side is 0 or negative
  if (side1 <= 0 || side2 <= 0) {
    throw new Error("Sides must be greater than 0");
  }

  // use the Pythagorean theorem to find the length of the third side
  const thirdSide = Math.sqrt(Math.pow(side1, 2) + Math.pow(side2, 2));

  // check if the result is a valid number
  if (isNaN(thirdSide)) {
    throw new Error("Invalid input");
  }

  return thirdSide;
}

export function findObjectPosition(
  p1: IPoint,
  p2: IPoint & { dist: number; dir: number },
  p3: IPoint & { dist: number; dir: number },
  target: { dist: number; dir: number }
): IPoint {
  const points: { x: number; y: number; dist: number }[] = [
    {
      x: p1.x,
      y: p1.y,
      dist: target.dist,
    },
    {
      x: p2.x,
      y: p2.y,
      dist: findThirdSide(target.dist, p2.dist),
    },
    {
      x: p3.x,
      y: p3.y,
      dist: findThirdSide(target.dist, p3.dist),
    },
  ];

  // find the coordinates of the intersection point of three circles
  const { x, y } = findByThreeFlags(points[0], points[1], points[2]);

  return { x, y };
}

export function findByTwoFlags(
  p1: IPoint & { dist: number },
  p2: IPoint & { dist: number }
) {
  let answer = null;
  if (p1.x === p2.x) {
    answer = coordsForSeemX(p1, p2);
  } else if (p1.y === p2.y) {
    answer = coordsForSeemY(p1, p2);
  } else {
    const alpha = (p1.y - p2.y) / (p2.x - p1.x);
    const beta =
      (p2.y ** 2 -
        p1.y ** 2 +
        p2.x ** 2 -
        p1.x ** 2 +
        p2.dist ** 2 -
        p2.dist ** 2) /
      (2 * (p2.x - p1.x));
    const a = alpha ** 2 + 1;
    const b = -2 * (alpha * (p1.x - beta) + p1.y);
    const c = (p1.x - beta) ** 2 + p1.y ** 2 - p2.dist ** 2;
    const ys = [];
    ys.push((-b + Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a));
    ys.push((-b - Math.sqrt(b ** 2 - 4 * a * c)) / (2 * a));
    const xs = [];
    xs.push(p1.x + Math.sqrt(p2.dist ** 2 - (ys[0] - p1.y) ** 2));
    xs.push(p1.x - Math.sqrt(p2.dist ** 2 - (ys[0] - p1.y) ** 2));
    xs.push(p1.x + Math.sqrt(p2.dist ** 2 - (ys[1] - p1.y) ** 2));
    xs.push(p1.x - Math.sqrt(p2.dist ** 2 - (ys[1] - p1.y) ** 2));
    answer = checkAnswersForTwoFlags(xs, ys);
  }
  return answer;
}

function checkAnswersForTwoFlags(xs: number[], ys: number[]) {
  let answer = null;
  xs.forEach((x, index) => {
    const ind = index < 2 ? 0 : 1;
    if (Math.abs(x) <= 54 && Math.abs(ys[ind]) <= 32) {
      answer = { x, y: ys[ind] };
    }
  });
  return answer;
}

export function getRelativeFlags(
  player: { dist: number; dir: number },
  flags: (IPoint & { dist: number; dir: number })[]
) {
  const newFlags: { dist: number; dir: number }[] = [player];

  flags.forEach((flag) => {
    const dist = findThirdSide(player.dist, flag.dist);
    newFlags.push(flag);
    newFlags[newFlags.length - 1].dist = dist;
  });
  return newFlags;
}

export function getFlags(
  flags: {
    p: number[];
    cmd: { p: string[] };
  }[],
  Flags: IFlagCoords
) {
  const new_flags: (IPoint & { dist: number; dir: number })[] = [];

  for (const flag of flags) {
    if (
      flag?.cmd?.p?.length &&
      (flag.cmd.p[0] === "f" || flag.cmd.p[0] === "g")
    ) {
      const key = flag.cmd.p.join("");

      if (key && Flags[key]) {
        const { x, y } = Flags[key];
        const [dist, dir] = flag.p;
        new_flags.push({ x, y, dist, dir });
      }
    }
  }
  return new_flags;
}

export function getDistanceForOtherPlayer(
  player: { p: number[] },
  flags: any[]
) {
  const newFlags: any[] = [];
  newFlags.push(player);
  flags.forEach((flag) => {
    const distanceForFlag = flag.p[0];
    const distanceForPlayer = player.p[0];
    const distanceBetweenFlagAndPlayer = Math.sqrt(
      Math.abs(
        distanceForFlag ** 2 +
          distanceForPlayer ** 2 -
          2 *
            distanceForPlayer *
            distanceForFlag *
            Math.cos((Math.abs(flag.p[1] - player.p[1]) * Math.PI) / 180)
      )
    );
    newFlags.push(flag);
    newFlags[newFlags.length - 1].p[0] = distanceBetweenFlagAndPlayer;
  });
  return newFlags;
}
