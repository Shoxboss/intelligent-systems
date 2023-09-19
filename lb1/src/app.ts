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
    const RMA = "RMA";
    const FCB = "FCB";
    const agent = new Agent(1, FCB);

    const agent1 = new Agent(2, RMA);
    socket(agent, FCB, version);
    socket(agent1, RMA, version);
    agent.rotationSpeed = rotationSpeed;
    agent.socketSend(`(move ${x} ${y})`);
    agent1.socketSend("(move 35 -25)");
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

  // Prompt the user for the player's initial x-coordinate
  const x = await new Promise<number>((resolve) => {
    rl.question("Enter the player's initial x-coordinate: ", (x) => {
      resolve(parseFloat(x));
    });
  });

  // Prompt the user for the player's initial y-coordinate
  const y = await new Promise<number>((resolve) => {
    rl.question("Enter the player's initial y-coordinate: ", (y) => {
      resolve(parseFloat(y));
    });
  });

  // Prompt the user for the player's rotation speed
  const rotationSpeed = await new Promise<number>((resolve) => {
    rl.question("Enter the player's rotation speed: ", (rotationSpeed) => {
      resolve(parseFloat(rotationSpeed));
    });
  });

  rl.close();

  return { x, y, rotationSpeed };
}
