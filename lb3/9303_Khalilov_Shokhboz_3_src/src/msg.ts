import { IMessage, Index } from "./interfaces";

export function parseMsg(msg: string): IMessage {
  // Remove trailing null character
  if (msg.endsWith("\u0000")) {
    msg = msg.substring(0, msg.length - "\u0000".length);
  }

  // Parse message
  const array = msg.match(/(\(|[-\d\.]+|[\\\"\w]+|\))/g);
  const res: IMessage = {
    msg,
    p: [],
  };
  // Analyze message starting from index 0, result in res
  parse(array, { idx: 0 }, res);
  makeCmd(res); // Extract command
  return res;
}

function parse(
  array: string[] | null,
  index: Index,
  res:
    | IMessage
    | {
        p: number[];
        cmd: { p: string[] };
      }
) {
  // Always start with an opening parenthesis
  if (array == null || array[index.idx] != "(") {
    return;
  }
  index.idx++;
  // Parse inside the parentheses
  parseInner(array, index, res);
}

function parseInner(
  array: string[] | null,
  index: Index,
  res: {
    p: (
      | string
      | number
      | {
          p: number[];
          cmd: { p: string[] };
        }
    )[];
  }
) {
  // Continue until a closing parenthesis is found
  while (array != null && array[index.idx] != ")") {
    // If there is another set of parentheses
    if (array[index.idx] == "(") {
      const r = { p: [] } as unknown as {
        p: number[];
        cmd: { p: string[] };
      };
      // Recursively parse the parentheses with the current index
      parse(array, index, r);
      res.p.push(r);
    } else {
      // Single parameter
      const num = parseFloat(array[index.idx]);
      res.p.push(isNaN(num) ? array[index.idx] : num);
      index.idx++;
    }
  }
  index.idx++;
}

function makeCmd(
  res:
    | IMessage
    | {
        p: number[];
        cmd: { p: string[] };
      }
) {
  if (res.p && res.p.length > 0) {
    // First parameter is the command
    res.cmd = res.p.shift() as unknown as string;
    // Extract commands from the parameters
    for (const value of res.p) {
      if (typeof value === "object") {
        makeCmd(value);
      }
    }
  }
}
