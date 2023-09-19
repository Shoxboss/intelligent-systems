import Msg from "./msg";
import { Socket } from "dgram";
import { IPlayerState } from "./interfaces";
import readline from "readline";
import {
  Command,
  DashCommand,
  KickCommand,
  TurnCommand,
} from "./helpers/commands";
import { ActionController } from "./utils/actionController";
import { FlagAction, KickAction } from "./helpers/actions";

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

export default class MyAgent {
  private id: number | string;
  private readonly teamName: string;
  private currentState: IPlayerState;

  private currentCommand: Command | null = null;

  private actionController: ActionController;

  socket!: Socket;
  rl: readline.Interface;

  is_run: boolean = false;
  _rotationSpeed: number = 10;

  set rotationSpeed(value: number) {
    this._rotationSpeed = value;
  }

  constructor(id: number, teamName: string) {
    this.id = id;
    this.teamName = teamName;
    this.currentState = {
      x: 0,
      y: 0,
      direction: 0,
      stamina: 8000,
      speed: 0,
      kickCooldown: 0,
      position: "l",
      target_goal: "r",
    };

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.currentCommand = null;

    this.actionController = new ActionController()
      .chain(new FlagAction("frb"))
      .chain(new FlagAction("gl"))
      .chain(new FlagAction("fc"))
      .chain(new KickAction("b", "gr"));
  }

  msgGot(msg: Buffer) {
    let data = msg.toString("utf8");

    this.proccessMsg(data);
    this.sendCommand();
  }

  initAgent(p: string[]) {
    if (p[0] == "r") this.currentState.position = "r"; // Правая половина поля
    if (p[1]) this.id = p[1]; // id игрока
  }
  proccessMsg(msg: string) {
    // Обработка сообщения
    let data = Msg.parseMsg(msg); // Разбор сообщения

    if (!data) {
      throw new Error("Parse error\n" + msg);
    }
    if (data.cmd == "hear") {
      if (data.msg.includes("play_on")) this.is_run = true;
      if (data.msg.includes("goal")) {
        this.actionController.reset();
        this.is_run = false;
      }
    }
    if (data.cmd == "init") {
      this.initAgent(data.p as string[]);
    }
    this.analyzeEnv(data.msg, data.cmd!, data.p); // Обработка
  }

  analyzeEnv(msg: string, cmd: string, p: any[]) {
    if (cmd === "see" && this.is_run) {
      const current = this.actionController.current;
      if (current) {
        if (current.act === "flag") {
          const flag = p.filter(
            (obj) => obj.cmd && obj.cmd.p.join("") === current.fl
          );

          if (flag.length) {
            if (flag[0].p[0] > 3 && flag[0].p[1] !== 0) {
              this.currentCommand = new TurnCommand(flag[0].p[1]);
            } else if (flag[0].p[0] > 3) {
              this.currentCommand = new DashCommand(80);
            } else {
              this.actionController.next();
            }
          } else {
            this.currentCommand = new TurnCommand(30);
          }
        } else if (current.act === "kick") {
          const ball = p.filter((obj) => obj.cmd && obj.cmd.p[0] === "b");
          const goal = p.filter(
            (obj) => obj.cmd && obj.cmd.p.join("") === current.goal
          );
          if (ball.length) {
            if (ball[0].p[0] > 0.5 && ball[0].p[1] !== 0) {
              this.currentCommand = new TurnCommand(ball[0].p[1]);
            } else if (ball[0].p[0] > 0.5) {
              this.currentCommand = new DashCommand(80);
            } else if (!goal.length) {
              this.currentCommand = new KickCommand(`10 30`);
            } else if (goal.length && Math.abs(goal[0].p[1]) > 15) {
              this.currentCommand = new KickCommand(`10 ${goal[0].p[1]}`);
            } else if (goal.length) {
              this.currentCommand = new KickCommand(`100 ${goal[0].p[1]}`);
            }
          } else {
            this.currentCommand = new TurnCommand(30);
          }
        }
      }
    }
  }

  getAngleToPoint(
    x: number,
    y: number,
    targetX: number,
    targetY: number
  ): number {
    const deltaX = targetX - x;
    const deltaY = targetY - y;
    const radian = Math.atan2(deltaY, deltaX);
    const degree = (radian * 180) / Math.PI;
    return degree;
  }

  sendCommand() {
    if (this.is_run) {
      // Игра начата
      if (this.currentCommand) {
        // Есть команда от игрока
        this.socketSend(this.currentCommand.cmd);
      }
      this.currentCommand = null; // Сброс команды
    }
  }

  socketSend(cmd: string) {
    this.socket.send(Buffer.from(cmd), 6000, "127.0.0.1", (err) => {
      if (err) {
        throw err;
      }
    });
  }
}
