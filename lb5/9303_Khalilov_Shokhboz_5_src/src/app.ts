import { player, Agent } from "./agents";
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

const tean_positions: [number, number, number, number, string][] = [
  [-50, 0, -50, 0, "GK"],
  [-25, 10, -35, 10, "LB"],
  [-25, -10, -35, -10, "RB"],
  [-30, 25, -30, 25, "CB"],
  [-30, -25, -30, -25, "CB"],
  [5, 20, -20, 20, "LM"],
  [0, 0, -25, 0, "CM"],
  [5, -20, -20, -20, "RM"],
  [35, 25, -2, 25, "LF"],
  [35, -25, -2, -25, "RF"],
  [40, 0, -10, 0, "CF"],
];

tean_positions.forEach(([x, y, mx, my, type], index) => {
  initPlayer(player(index + 1, RMA, "l", { x, y }, type), RMA, [mx, my], "l");
  initPlayer(
    player(index + 1, FCB, "r", { x, y: -y }, type),
    FCB,
    [mx, my],
    "r"
  );
});
