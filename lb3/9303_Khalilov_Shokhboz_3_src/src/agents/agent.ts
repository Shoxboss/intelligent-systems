import { parseMsg } from "../msg";
import { Socket } from "dgram";
import { ICommand, IMessage, IPlayerState } from "../interfaces";
import DecisionTreeManager from "../helpers/BT/manager";
import { FlagDT } from "../helpers/BT/movement";
import { PlayerDT } from "../helpers/BT/player";
import { GoalieDT } from "../helpers/BT/goalie";


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
  private act: ICommand | null = null;
  // private behaviorTree: BehaviorTree;

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
    if (p[0] === "r") this.currentState.position = "r"; // Правая половина поля
    if (p[1]) this.id = p[1]; // id игрока
  }
  proccessMsg(msg: string) {
    // Обработка сообщения
    let data = parseMsg(msg); // Разбор сообщения

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

    this.analyzeEnv(data); // Обработка
  }

  analyzeEnv(data: IMessage) {
    const { msg, cmd, p } = data;

    if (cmd === "see") {
      const { position } = this.currentState;
      const id = this.id;

      if (position === "l" && id === 1) {
        this.act = DecisionTreeManager.getAction(FlagDT, p);
      } else if (position === "l" && this.id === 2) {
        const dt = Object.assign({}, PlayerDT);
        dt.state.leader = `p"${this.teamName}"1`;
        this.act = DecisionTreeManager.getAction(dt, p);
      } else if (position === "r" && id === 1) {
        this.act = DecisionTreeManager.getAction(GoalieDT, p);
   
      }
    }

  }

  sendCommand() {
    if (this.is_run) {
      if (this.act) {
        const { n, v } = this.act;
        if (n == "kick") {
          this.socketSend(`(${n} ${v})`);
        }
        else this.socketSend(`(${n} ${v})`);
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
