import { findByThreeFlags, getPosition } from "../location";
import { FlagCoords } from "../../constants/flagCoords";
import { ITaken, ObjectData, ITakenState } from "./interfaces";
import {
  getDistanceForOtherPlayer,
  getFlags,
  getRelativeFlags,
} from "./getCoords";

const Taken: ITaken = {
  state: {
    teamEnemy: [],
    teamOwn: [],
    closest: function (flag: string | boolean): {
      // look around flags
      coords: { x: number; y: number };
      dist: number;
    }[] {
      return [];
    },
  },
  setHear(input): void {},
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
      closest: function (flag: string | boolean): {
        // look around flags
        coords: { x: number; y: number };
        dist: number;
      }[] {
        return [];
      },
    };

    let [head, ...tail] = input;

    // time
    state.time = head;

    // ball
    state.ball = this.getObjData(
      tail.find((obj) => obj.cmd && obj.cmd.p[0] === "b")
    );

    // goal
    let gr = this.getObjData(
      tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "gr")
    );
    let gl = this.getObjData(
      tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "gl")
    );
    if (gl) {
      gl = {
        ...gl,
        ...FlagCoords["gl"],
      };
    }
    if (gr) {
      gr = {
        ...gr,
        ...FlagCoords["gr"],
      };
    }
    state.goalOwn = side === "l" ? gl : gr;
    state.goal = side === "l" ? gr : gl;

    state.side = side;

    // look around flags
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
      fplb: this.getObjData(
        tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "fplb")
      ),
      fplc: this.getObjData(
        tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "fplc")
      ),
      fplt: this.getObjData(
        tail.find((obj) => obj.cmd && obj.cmd.p.join("") === "fplt")
      ),
    };

    state.teamOwn = tail
      .filter(
        (obj) => obj.cmd && obj.cmd.p[0] === "p" && obj.cmd.p[1] === `"${team}"`
      )
      .map((obj) => this.getObjData(obj)) as ObjectData[];

    state.teamEnemy = tail
      .filter((obj) => obj.cmd && obj.cmd.p[0] === "p")
      .map((obj) => this.getObjData(obj)) as ObjectData[];

    const teamEnemy = tail.filter((obj) => obj.cmd && obj.cmd.p[0] === "p");

    const teamOwn = tail.filter(
      (obj) => obj.cmd && obj.cmd.p[0] === "p" && obj.cmd.p[1] === `"${team}"`
    );

    // flags count
    state.topFlagsCount = tail.filter(
      (obj) => obj.cmd && obj.cmd.p[0] === "f" && obj.cmd.p.includes("t")
    ).length;
    state.botFlagsCount = tail.filter(
      (obj) => obj.cmd && obj.cmd.p[0] === "f" && obj.cmd.p.includes("b")
    ).length;

    const flagsList = getFlags(tail, FlagCoords);

    const my_pos = getPosition(tail);

    state.my_pos = my_pos ?? undefined;

    if (state.ball) {
      const flagsForBall = getRelativeFlags(
        {
          dir: state.ball.angle,
          dist: state.ball.dist,
        },
        flagsList
      );

      if (flagsForBall.length > 2 || (flagsForBall.length == 2 && my_pos)) {
        const ballCoords = findByThreeFlags(
          flagsForBall[0],
          flagsForBall[1],
          flagsForBall[2] ?? my_pos
        );

        state.ball.x = ballCoords.x;
        state.ball.y = ballCoords.y;
      }
    }

    state.closest = (myTeam: string | boolean) => {
      const ballObj = tail.find((obj) => obj.cmd && obj.cmd.p[0] === "b");
      if (ballObj) {
        if (flagsList.length < 2) {
          console.log("Мало флагов");
        } else {
          const distanceList: {
            coords: { x: number; y: number };
            dist: number;
          }[] = [];

          let playersList = [];
          if (myTeam) {
            playersList = teamOwn;
          } else {
            playersList = teamEnemy;
          }
          playersList.forEach((p) => {
            const newFlags = getRelativeFlags(
              {
                dir: p.p[1],
                dist: p.p[0],
              },
              flagsList
            );

            const playerCoords = findByThreeFlags(
              newFlags[0],
              newFlags[1],
              newFlags[2] ?? my_pos
            );
            if (playerCoords) {
              distanceList.push({
                coords: playerCoords,
                dist: Math.sqrt(
                  ballObj.p[0] ** 2 +
                    p.p[0] ** 2 -
                    2 *
                      ballObj.p[0] *
                      p.p[0] *
                      Math.cos(((p.p[1] - ballObj.p[1]) * Math.PI) / 180)
                ),
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
    // const flags = input.filter(
    //   (obj) => obj.cmd && (obj.cmd.p[0] === "f" || obj.cmd.p[0] === "g")
    // );
    // if (flags.length >= 2) {
    //   let myPos = null;
    //   if (flags.length === 2) {
    //     myPos = getAnswerForTwoFlags(flags, FlagCoords);
    //   } else {
    //     myPos = coordsApi.getAnswerForThreeFlags(flags, FlagCoords);
    //   }
    //   return myPos;
    // }
    // return null;
  },
};

export default Taken;
