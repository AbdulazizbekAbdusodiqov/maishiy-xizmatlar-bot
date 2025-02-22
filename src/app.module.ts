import { Module } from "@nestjs/common";
import { BotModule } from "./bot/bot.module";
import { TelegrafModule } from "nestjs-telegraf";
import { ConfigModule } from "@nestjs/config";
import { Bot } from "./bot/models/bot.model";
import { SequelizeModule } from "@nestjs/sequelize";
import { Profession } from "./bot/models/professions.model";
import { Master } from "./bot/models/master.model";
import { BOT_NAME } from "./app.constants";
import { Customer } from "./bot/models/customer.model";
import { SelectedServices } from "./bot/models/selected_services.model";

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    TelegrafModule.forRoot({
      botName:BOT_NAME,
      token: process.env.BOT_TOKEN!,
    }),
    SequelizeModule.forRoot({
      dialect: "postgres",
      host: process.env.POSTGRES_HOST,
      username: process.env.POSTGRES_USER,
      port: Number(process.env.POSTGRES_PORT),
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      models: [Bot,Profession, Master, Customer, SelectedServices ],
      autoLoadModels: true,
      sync: { alter: true, force:false },
      logging: false,
    }),
    BotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
