import { Context } from "telegraf";
import { BotService } from "./bot.service";
import { Command, Ctx, Hears, On, Start, Update } from "nestjs-telegraf";
import { UseFilters, UseGuards } from "@nestjs/common";
import { TelegrafExceptionFilter } from "src/filters/telegraf-exception.filter";
import { AdminBotGuard } from "src/guards/admin-bot.guard";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.onStart(ctx);
  }

  @Hears("Ro'yxatdan o'tish 👨‍💻")
  async onRegistration(@Ctx() ctx: Context) {
    await this.botService.onRegistration(ctx);
  }

  @Hears("Usta 👨‍🔧")
  async onClickMaster(@Ctx() ctx: Context) {
    await this.botService.onClickMaster(ctx);
  }
  
  @UseFilters(TelegrafExceptionFilter)
  @UseGuards(AdminBotGuard)
  @Command("admin")
  async onCommanAdmin(@Ctx() ctx: Context) {
    await this.botService.onCommanAdmin(ctx);
  }
  
  @UseFilters(TelegrafExceptionFilter)
  @UseGuards(AdminBotGuard)
  @Hears("Kasb qo'shish 🧑‍💻")
  async onAddPerfission(@Ctx() ctx: Context) {
    await this.botService.onAddPerfission(ctx);
  }
  
  @On('text')
  async onText(@Ctx() ctx: Context){
    await this.botService.onText(ctx);
  }

}
