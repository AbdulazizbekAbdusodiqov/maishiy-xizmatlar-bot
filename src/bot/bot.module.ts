import { Module } from "@nestjs/common";
import { BotService } from "./bot.service";
import { BotUpdate } from "./bot.update";
import { Bot } from "./models/bot.model";
import { SequelizeModule } from "@nestjs/sequelize";
import { Profession } from "./models/professions.model";
import { Master } from "./models/master.model";
import { Rating } from "./models/rating.model";

@Module({
  imports: [SequelizeModule.forFeature([Bot, Profession, Master, Rating])],
  providers: [
    BotUpdate,
    BotService,
  ],
  exports: [BotService],
})
export class BotModule {}
