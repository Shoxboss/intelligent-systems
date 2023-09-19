import { parseMsg } from "../msg";
import { Socket } from "dgram";
import { IMessage, IPlayerState } from "../interfaces";

import TA_Manager, { IPInputType } from "../helpers/TA/manager";
import attacker_ta from "../helpers/TA/attacker";
import defender_ta from "../helpers/TA/defender";
import midfielder_ta from "../helpers/TA/midfielder";
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
  // private behaviorTree: BehaviorTree;

  is_run: boolean = false;
  _rotationSpeed: number = 10;
  socket!: Socket;

  set rotationSpeed(value: number) {
    this._rotationSpeed = value;
  }

  count = 0;

  constructor(
    teamName: string,
    position: "l" | "r",
    private default_pos: { x: number; y: number },
    private type: string
  ) {
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
      if (data.msg.includes("play_on")) {
        TA_Manager.reset();
        this.is_run = true;
      }
      if (data.msg.includes("goal")) {
        this.is_run = false;
      }
    }
    if (data.cmd == "init") {
      this.initAgent(data.p as unknown as string[]);
    }

    if (this.count === 0 && this.currentState.position == "r") {
      this.act = { n: "turn", v: "180" };
      this.sendCommand();
      this.count++;
      return;
    }

    this.analyzeEnv(data); // Обработка
  }

  analyzeEnv(data: IMessage) {
    const { msg, cmd, p } = data;

    if (cmd === "hear") {
      if (
        (p as [number, string, string])[2].includes("goal_l") ||
        (p as [number, string, string])[2].includes("goal_r")
      ) {
        this.act = {
          n: "move",
          v: `${this.default_pos.x} ${this.default_pos.y}`,
        };
      } else if (this.is_run) {
        TA_Manager.setHear(p as IPInputType);
      }
    }

    if (cmd === "see" && this.is_run) {
      if (this.id === 1) {
        this.act = TA_Manager.getAction(
          p as IPInputType,
          goalie_ta,
          {
            team: this.teamName,
            id: this.id,
            def_pos: this.default_pos,
            type: this.type,
            side: this.currentState.position,
          },
          false
        );
      } else if (this.id <= 5) {
        this.act = TA_Manager.getAction(
          p as IPInputType,
          attacker_ta,
          {
            team: this.teamName,
            id: this.id as number,
            def_pos: this.default_pos,
            type: this.type,
            side: this.currentState.position,
          },
          false
        );
      } else if (this.id <= 8) {
        this.act = TA_Manager.getAction(
          p as IPInputType,
          attacker_ta,
          {
            team: this.teamName,
            id: this.id as number,
            def_pos: this.default_pos,
            type: this.type,
            side: this.currentState.position,
          },
          false
        );
      } else {
        this.act = TA_Manager.getAction(
          p as IPInputType,
          attacker_ta,
          {
            team: this.teamName,
            id: this.id as number,
            def_pos: this.default_pos,
            type: this.type,
            side: this.currentState.position,
          },
          false
        );
      }
    }
  }

  sendCommand() {
    if (this.is_run) {
      if (this.act) {
        const { n, v } = this.act;
        if (n !== "move") {
          if (n && v) {
            this.socketSend(`(${n} ${v})`);
          }
        } else {
          this.is_run = false;
          this.socketSend(`(${n} ${v})`);
        }
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
