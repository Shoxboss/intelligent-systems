import { player, goalkeepr, Agent } from "./agents";
import socket from "./socket";

const VERSION = 7;
const RMA = "RMA";
const FCB = "FCB";

function initPlayer(
  player: Agent,
  team: string,
  [x, y]: [number, number],
  position: "l" | "r",
  goalie: boolean = false
) {
  socket(player, team, VERSION, goalie);
  player.socketSend(`(move ${x} ${position === "r" ? -1 * y : y})`);
}

[
  [-50, 0],
  [-35, 10],
  [-35, -10],
  [-30, 25],
  [-30, -25],
  [-20, 20],
  [-25, 0],
  [-20, -20],
  [-2, 25],
  [-2, -25],
  [-10, 0],
].forEach(([x, y], i) => {
  initPlayer(player(i + 1, RMA, "l"), RMA, [x, y], "l");
  initPlayer(player(i + 1, FCB, "r"), FCB, [x, y], "r");
});
