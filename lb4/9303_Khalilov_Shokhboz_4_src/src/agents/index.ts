import Agent from "./agent";

export function goalkeepr(num: number, team: string, position: "l" | "r") {
  return new Agent(team, position);
}

export function player(num: number, team: string, position: "l" | "r") {
  return new Agent(team, position);
}

export { Agent };
