
export interface IPlayerParam {
  id: number;
  teamName: string;
}


export interface IServerParam {
  maxPower: number;
  minPower: number;
  playerSize: number;
  kickableMargin: number;
  visibleAngle: number;
}

export interface IPlayerState {
  x: number;
  y: number;
  direction: number;
  stamina: number;
  speed: number;
  kickCooldown: number;
  position: "l" | "r";
  target_goal: "l" | "r";
  team: string;
}

export interface IPoint {
  x: number;
  y: number;
}

export interface ISeeData {
  time: number;
  flags: {
    [key: string]: {
      dist: number;
      dir: number;
      x: number;
      y: number;
      distChange?: number;
      dirChange?: number;
    };
  };
  lines: {
    [key: string]: {
      dist: number;
      dir: number;
      x: [number, number];
      y: [number, number];
    };
  };
  goal?: {
    [key: string]: {
      dist: number;
      dir: number;
    };
  };
  ball?: { dist: number; dir: number; distChange?: number; dirChange?: number };
}



