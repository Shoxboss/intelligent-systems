import dgram from "node:dgram";
import Agent from "./agents/agent";

export default function (
  agent: Agent,
  teamName: string,
  version: number,
  goalie: boolean = false
) {
  const socket = dgram.createSocket({
    type: "udp4",
    reuseAddr: true,
  });

  agent.socket = socket;
  socket.on("message", (message: Buffer) => {
    agent.msgGot(message);
  });

  socket.send(
    `(init ${teamName} (version ${version}) ${goalie ? "(goalie)" : ""})`,
    6000,
    "127.0.0.1",
    (err) => {
      if (err) {
        throw err;
      }
    }
  );
}
