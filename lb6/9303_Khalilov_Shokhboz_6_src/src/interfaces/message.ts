export interface IMessage {
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
  