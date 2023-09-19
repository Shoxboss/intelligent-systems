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
  player.socketSend(`(move ${position === "r" ? -1 * x : x} ${y})`);
}

initPlayer(player(7, RMA, "l"), RMA, [-10, 0], "l");
initPlayer(player(5, RMA, "l"), RMA, [-15, 0], "l");
initPlayer(goalkeepr(1, FCB, "r"), FCB, [15, 0], "r", true);
