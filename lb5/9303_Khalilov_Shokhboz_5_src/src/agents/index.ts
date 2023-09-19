import Agent from "./agent";

export function player(
  num: number,
  team: string,
  position: "l" | "r",
  pos: { x: number; y: number },
  type:
    | "GK"
    | "CB"
    | "LB"
    | "RB"
    | "LM"
    | "RM"
    | "CM"
    | "LF"
    | "RF"
    | "CF"
    | string
) {
  return new Agent(team, position, pos, type);
}

export { Agent };
