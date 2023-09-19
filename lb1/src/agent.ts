import { Socket } from "dgram";
import { IAction, IPlayerState, IServerParam } from "./interfaces";
import readline from "readline";
import { Controller, IPlayer, ISeeResponse } from "./utils/controller";
import {
  DashCommand,
  ICommand,
  KickCommand,
  MoveCommand,
  TurnCommand,
} from "./helpers/commands";
import { HearSender } from "./enums/HearSender";

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
  private id: number | string;
  private readonly teamName: string;
  private serverParam: IServerParam;
  private currentState: IPlayerState;

  private currentAction: IAction | null;
  private prevAction: IAction | null = null;

  private actions: IAction[];
  currentActionIndex: number = 0;

  private controller: Controller;

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
    this.serverParam = {
      maxPower: 100,
      minPower: 10,
      playerSize: 0.3,
      kickableMargin: 0.7,
      visibleAngle: 90,
    };
    this.currentState = {
      x: 0,
      y: 0,
      direction: 0,
      stamina: 8000,
      speed: 0,
      kickCooldown: 0,
      position: "r",
    };
    this.currentAction = null;
    this.actions = [];

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.controller = new Controller();

    this.rl.on("line", (input: any) => {
      if (this.is_run) {
        switch (input) {
          case "w":
            this.currentAction = new DashCommand(100, 0);
            break;
          case "d":
            this.currentAction = new TurnCommand(this._rotationSpeed);
            break;
          case "a":
            this.currentAction = new TurnCommand(-this._rotationSpeed);
            break;
          case "s":
            this.currentAction = new KickCommand(100, 0);
            break;
        }
      }
    });

    this.actions = [];
    console.log(`${teamName}: ${id}`);
  }

  msgGot(msg: Buffer) {
    let data = msg.toString("utf8");
    this.proccessMsg(data);
    this.sendCommand();
  }

  proccessMsg(msg: string) {
    if (!msg) {
      throw new Error("Parse error\n" + msg);
    }

    if (msg.startsWith("(hear")) {
      const parsed_data = this.controller.parseHearResponse(msg);
      if (
        parsed_data?.sender === HearSender.Referee &&
        parsed_data.message === "play_on"
      ) {
      }
      this.is_run = true;
    }
    if (msg.startsWith("(init")) {
      const regex = /\(init\s(\w+)\s([\d\-\.]+)\s(\w+)\)/;
      const match = msg.match(regex);

      if (match) {
        const [, position, id, _ms] = match;
        this.initAgent(position as "l" | "r", id);
      }
    }
    if (msg.startsWith("(see")) {
      const see_data = this.controller.parseSeeResponse(msg, this.teamName);

      if (see_data) {
        this.reflection(see_data);
        if (see_data.opponents.length > 0) {
          const opponent = see_data.opponents[0];

          const res = this.determineOpponentPosition(
            this.currentState.x,
            this.currentState.y,
            opponent.dist,
            opponent.dir
          );
          if (res) {
            const { x, y } = res;

            console.log(
              `enemy--[ team: ${opponent.teamName}, number: ${opponent.unum}, position: {${x}, ${y}}]`
            );
          }
        } else {
          console.log("enemy--[not see]");
        }
      } else {
        this.currentAction = new TurnCommand(this._rotationSpeed);
      }
    }

    if (msg.startsWith("(sense_body")) {
      // parseSenseBodyResponse(msg)
    }

    // this.analyzeEnv(data.msg, data.cmd, data.p as string[]);
  }

  isBallNear(see_data: ISeeResponse): boolean {
    return see_data.ball!.dist < 0.7;
  }
  isTargetGoalNear(see_data: ISeeResponse): boolean {
    const { l, r } = see_data.goals;
    if (this.currentState.position === "l" && r) {
      return r.dist < 16;
    } else if (this.currentState.position === "r" && l) {
      return l.dist < 16;
    }
    return false;
  }

  isTargetGoalVisble(see_data: ISeeResponse) {
    const { l, r } = see_data.goals;
    if (this.currentState.position === "l" && r) {
      return !!r;
    } else if (this.currentState.position === "r" && l) {
      return !!l;
    }
    return false;
  }

  isBallVisble(see_data: ISeeResponse): boolean {
    return !!see_data.ball;
  }

  amInside(see_data: ISeeResponse): boolean {
    return false;
  }

  determineOpponentPosition(
    x: number,
    y: number,
    dist: number,
    dir: number
  ): { x: number; y: number } {
    // Convert direction to radians
    const radians = (dir * Math.PI) / 180;

    // Calculate opponent position using trigonometry
    const oppX = x + dist * Math.cos(radians);
    const oppY = y + dist * Math.sin(radians);

    // Return opponent position as object
    return { x: oppX, y: oppY };
  }

  reflection(see_data: ISeeResponse) {
    const coordinates = this.controller.getAllPossibleCoordinates(see_data);

    if (coordinates) {
      const coordinate = this.controller.getMostProbableCoordinates(
        see_data,
        coordinates
      );
      if (coordinate) {
        const [x, y] = coordinate;

        if (x && y) {
          this.currentState.x = x;
          this.currentState.y = y;
          console.log(
            `Self--[ team: ${this.teamName}, number: ${this.id}, position: {${x}, ${y}}]\n`
          );
        }
      }

      const cmd = this.checkAndMoveInsideArea(see_data);
      if (cmd) {
        this.currentAction = cmd;
        return;
      }

      if (this.isBallVisble(see_data)) {
        if (this.isBallNear(see_data)) {
          if (this.isTargetGoalVisble(see_data)) {
            const { l, r } = see_data.goals;
            if (this.currentState.position === "l") {
              if (r) {
                const dir = r.dir;

                if (this.isTargetGoalNear(see_data)) {
                  this.currentAction = new KickCommand(100, dir);
                } else {
                  this.currentAction = new KickCommand(8, dir);
                }
              }
            } else {
              if (l) {
                const dir = l.dir;

                if (this.isTargetGoalNear(see_data)) {
                  this.currentAction = new KickCommand(100, dir);
                } else {
                  this.currentAction = new KickCommand(8, dir);
                }
              }
            }
          } else {
            this.currentAction = new TurnCommand(this._rotationSpeed);
          }
        } else {
          this.currentAction = new DashCommand(40, see_data.ball?.dir!);
        }
      } else {
        if (
          this.controller.isInArea({
            x: this.currentState.x,
            y: this.currentState.y,
          }) === false
        ) {
          const { t, b } = see_data.lines;
          if (t && b) {
            let line = t.dist! > b.dist! ? t : b;
            this.currentAction = new DashCommand(50, line.dir!);
          } else if (b) {
            this.currentAction = new DashCommand(50, b.dir!);
          } else if (t) {
            this.currentAction = new DashCommand(50, t.dir!);
          } else {
            this.currentAction = new TurnCommand(this._rotationSpeed);
          }
          // this.currentAction = new DashCommand(0, 0);
        } else {
          this.currentAction = new TurnCommand(this._rotationSpeed);
        }
      }
    } else {
      this.currentAction = new TurnCommand(this._rotationSpeed);
    }
  }

  createCommand(action: IAction): string {
    return action.toString();
  }

  public checkAndMoveInsideArea(data: ISeeResponse): ICommand | null {
    const player = this;
    if (!player) {
      return null;
    }

    const { x, y } = player.currentState;

    if (Math.abs(x) > 40 && Math.abs(y) > 20) {
      const targetX = Math.sign(x) * 37;
      const targetY = Math.sign(y) * 18;
      const angle = this.getAngleToPoint(x, y, targetX, targetY);
      return new TurnCommand(angle).chain(new DashCommand(50, 0));
    }

    return null;
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
      if (this.currentAction) {
        const command = this.createCommand(this.currentAction);
        this.prevAction = this.currentAction;
        this.currentAction = null;
        this.socketSend(command);
      }
    }
  }

  initAgent(position: "l" | "r", id: string) {
    this.currentState.position = position;
    this.id = id;
  }

  socketSend(cmd: string) {
    this.socket.send(Buffer.from(cmd), 6000, "127.0.0.1", (err) => {
      if (err) {
        throw err;
      }
    });
  }
}
