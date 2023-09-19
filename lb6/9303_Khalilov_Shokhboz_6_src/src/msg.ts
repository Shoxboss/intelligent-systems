import { IMessage } from "./interfaces";

interface Index {
  idx: number;
}


export function parseMsg(msg: string): IMessage {
  
  if (msg.endsWith("\u0000")) {
    msg = msg.substring(0, msg.length - "\u0000".length);
  }

  
  const array = msg.match(/(\(|[-\d\.]+|[\\\"\w]+|\))/g);
  const res: IMessage = {
    msg,
    p: [],
  };
  
  parse(array, { idx: 0 }, res);
  makeCmd(res); 
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
  
  if (array == null || array[index.idx] != "(") {
    return;
  }
  index.idx++;
  
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
  
  while (array != null && array[index.idx] != ")") {
    
    if (array[index.idx] == "(") {
      const r = { p: [] } as unknown as {
        p: number[];
        cmd: { p: string[] };
      };
      
      parse(array, index, r);
      res.p.push(r);
    } else {
      
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
    
    res.cmd = res.p.shift() as unknown as string;
    
    for (const value of res.p) {
      if (typeof value === "object") {
        makeCmd(value);
      }
    }
  }
}
