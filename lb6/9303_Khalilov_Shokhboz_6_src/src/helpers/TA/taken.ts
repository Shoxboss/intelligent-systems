import { getPosition } from "../location";
import { FlagCoords } from "../../constants/flagCoords";
import { ITaken, ObjectData, ITakenState } from "./interfaces";
import { findByThreeFlags, getFlags, getRelativeFlags } from "./getCoords";

const Taken: ITaken = {
  state: {
    teamEnemy: [],
    teamOwn: [],
  },
  setHear(input): void {
    
  },
  getObjData(obj) {
    if (!obj) return undefined;
    const objData: ObjectData = {
      f: obj.cmd.p.join(""),
      angle: 0,
      dist: 0,
    };
    switch (obj.p.length) {
      case 1:
        objData.angle = obj.p[0];
        break;
      default:
        objData.dist = obj.p[0];
        objData.angle = obj.p[1];
    }
    return objData;
  },
  setSee(input, team, side) {
    const state: ITakenState = {
      teamOwn: [],
      teamEnemy: [],
    };

    const [head, ...tail] = input;

    
    state.time = head;

    
    state.ball = this.getObjData(
      tail.find((obj) => obj.cmd && obj.cmd.p[0] === "b")
    );

    
    const gr = this.getObjData(
      tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "gr")
    );
    const gl = this.getObjData(
      tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "gl")
    );
    state.goalOwn = side === "l" ? gl : gr;
    state.goal = side === "l" ? gr : gl;

    
    state.lookAroundFlags = {
      fprb: this.getObjData(
        tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "fprb")
      ),
      fprc: this.getObjData(
        tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "fprc")
      ),
      fprt: this.getObjData(
        tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "fprt")
      ),
    };

    state.teamOwn = tail
      .filter(
        (obj) => obj.cmd && obj.cmd.p[0] === "p" && obj.cmd.p[1] === `"${team}"`
      )
      .map((obj) => this.getObjData(obj)) as ObjectData[];

    state.teamEnemy = tail
      .filter(
        (obj) => obj.cmd && obj.cmd.p[0] === "p" && obj.cmd.p[1] !== `"${team}"`
      )
      .map((obj) => this.getObjData(obj)) as ObjectData[];

    
    state.topFlagsCount = tail.filter(
      (obj) => obj.cmd && obj.cmd.p[0] === "f" && obj.cmd.p.includes("t")
    ).length;
    state.botFlagsCount = tail.filter(
      (obj) => obj.cmd && obj.cmd.p[0] === "f" && obj.cmd.p.includes("b")
    ).length;

    const opponents = tail.filter(
      (obj) => obj.cmd && obj.cmd.p[0] === "p" && obj.cmd.p[1] !== `"${team}"`
    );
    const teammates = tail.filter(
      (obj) => obj.cmd && obj.cmd.p[0] === "p" && obj.cmd.p[1] === `"${team}"`
    );
    
    const myPos = this.getMyPos(input);

    const flags = getFlags(tail, FlagCoords);

    state.closestTeammates = (): {
      coords: { x: number; y: number };
      dist: number;
      dir: number;
    }[] => {
      if (state.ball) {
        if (flags.length < 2) {
          console.log("Мало флагов");
        } else {
          const flaglist = flags;

          const distanceList: {
            coords: { x: number; y: number };
            dist: number;
            dir: number;
          }[] = [];
          let playersList = [];
          playersList = teammates;

          playersList.forEach((p: { p: any[] }) => {
            const newFlags = getRelativeFlags(
              {
                dir: p.p[1],
                dist: p.p[0],
              },
              flaglist
            );
            const playerCoords = findByThreeFlags(
              newFlags[0],
              newFlags[1],
              newFlags[2] ?? myPos
            );
            if (playerCoords) {
              distanceList.push({
                coords: playerCoords,
                dist: Math.sqrt(
                  state.ball!.dist ** 2 +
                    p.p[0] ** 2 -
                    2 *
                      state.ball!.dist *
                      p.p[0] *
                      Math.cos(((p.p[1] - state.ball!.angle) * Math.PI) / 180)
                ),
                dir: p.p[1],
              });
            }
          });
          distanceList.sort((dist1, dist2) => {
            return dist1.dist - dist2.dist;
          });
          return distanceList;
        }
      }
      return [];
    };

    

    this.state = state;
    return this;
  },
  getMyPos(input: any[]): number[] | null {
    const pos = getPosition(input);

    if (pos) {
      return [pos.x, pos.y];
    }
    return null;
    
    
    
    
    
    
    
    
    
    
    
    
    
  },
};

export default Taken;
