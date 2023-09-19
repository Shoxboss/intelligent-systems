import { HearSender } from "../enums/HearSender";
import { IPlayerParam, ISeeResponse, IServerParam } from "./common";

export interface IInitResponse {
  playerParam: IPlayerParam;
  serverParam: IServerParam;
}

export interface IHearResponse {
  time: number;
  sender: HearSender;
  message: string;
}
