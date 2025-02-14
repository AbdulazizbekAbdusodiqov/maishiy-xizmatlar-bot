import { BotService } from "./bot.service";
import { Update } from "nestjs-telegraf";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}
}
