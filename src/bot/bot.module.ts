import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { Bot } from './models/bot.model';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports:[SequelizeModule.forFeature([Bot])],
  providers: [BotUpdate, BotService],
  exports : [BotService]
})
export class BotModule {}
