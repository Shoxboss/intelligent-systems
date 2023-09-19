import Agent from "./agent";
import socket from "./socket";
import * as readline from "readline";

getInitialCoordinatesAndRotationSpeed().then(
  ({
    x,
    y,
    rotationSpeed,
  }: {
    x: number;
    y: number;
    rotationSpeed: number;
  }) => {
    const version = 7;
    const FCB = "FCB";
    const agent = new Agent(1, FCB);
    socket(agent, FCB, version);
    agent.rotationSpeed = rotationSpeed;
    agent.socketSend(`(move ${x} ${y})`);

    // const RMA = "RMA";
    // const agent1 = new Agent(2, RMA);
    // socket(agent1, RMA, version);
    // agent1.socketSend("(move -15 -20)");
  }
);

async function getInitialCoordinatesAndRotationSpeed(): Promise<{
  x: number;
  y: number;
  rotationSpeed: number;
}> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const x = await new Promise<number>((resolve) => {
    rl.question("Enter the player's initial x-coordinate: ", (x) => {
      resolve(parseFloat(x));
    });
  });

  const y = await new Promise<number>((resolve) => {
    rl.question("Enter the player's initial y-coordinate: ", (y) => {
      resolve(parseFloat(y));
    });
  });

  const rotationSpeed = await new Promise<number>((resolve) => {
    rl.question("Enter the player's rotation speed: ", (rotationSpeed) => {
      resolve(parseFloat(rotationSpeed));
    });
  });

  rl.close();

  return { x, y, rotationSpeed };
}
