import { parseMsg } from "../msg";
import { Socket } from "dgram";
import { IMessage, IPlayerState } from "../interfaces";

import TA_Manager, { IPInputType } from "../helpers/TA/manager";
import attacker_ta from "../helpers/TA/attacker";
import goalie_ta from "../helpers/TA/goalie";
import { ICommand } from "../interfaces";

export interface IFlag {
  key: string;
  value: string;
}

export class Flag implements IFlag {
  constructor(public _key: string, private _value: string) {}

  get key() {
    return this._key;
  }

  get value() {
    return this._value;
  }
}

export default class Agent {
  private id!: number | string;
  private readonly teamName: string;
  private currentState: IPlayerState;
  private act: ICommand | null | undefined = null;

  is_run: boolean = false;
  _rotationSpeed: number = 10;
  socket!: Socket;

  set rotationSpeed(value: number) {
    this._rotationSpeed = value;
  }

  constructor(teamName: string, position: "l" | "r") {
    this.teamName = teamName;
    this.currentState = {
      team: teamName,
      x: 0,
      y: 0,
      direction: 0,
      stamina: 8000,
      speed: 0,
      kickCooldown: 0,
      position: position,
      target_goal: position === "l" ? "r" : "l",
    };
  }

  msgGot(msg: Buffer) {
    let data = msg.toString("utf8");

    this.proccessMsg(data);
    this.sendCommand();
  }

  initAgent(p: string[]) {
    if (p[0] === "r") this.currentState.position = "r";
    if (p[1]) this.id = p[1];
  }
  proccessMsg(msg: string) {
    let data = parseMsg(msg);

    if (!data) {
      throw new Error("Parse error\n" + msg);
    }
    if (data.cmd == "hear") {
      if (data.msg.includes("play_on")) this.is_run = true;
      if (data.msg.includes("goal")) {
        this.is_run = false;
      }
    }
    if (data.cmd == "init") {
      this.initAgent(data.p as unknown as string[]);
    }

    this.analyzeEnv(data);
  }

  analyzeEnv(data: IMessage) {
    const { msg, cmd, p } = data;

    if (cmd === "see" && this.is_run) {
      if (this.id !== 1) {
        this.act = TA_Manager.getAction(
          p as IPInputType,
          attacker_ta,
          this.teamName,
          this.currentState.position,
          false
        );
      } else {
        this.act = TA_Manager.getAction(
          p as IPInputType,
          goalie_ta,
          this.teamName,
          this.currentState.position,
          false
        );
      }
    } else if (cmd === "hear" && this.is_run) {
      TA_Manager.setHear(p as IPInputType);
    }
  }

  sendCommand() {
    if (this.is_run) {
      if (this.act) {
        const { n, v } = this.act;
        if (n == "kick") {
          this.socketSend(`(${n} ${v})`);
        } else this.socketSend(`(${n} ${v})`);
      }
      this.act = null;
    }
  }

  socketSend(cmd: string) {
    this.socket.send(Buffer.from(cmd), 6000, "127.0.0.1", (err: any) => {
      if (err) {
        throw err;
      }
    });
  }
}
