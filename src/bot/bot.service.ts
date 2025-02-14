import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Context, Markup } from "telegraf";
import { Bot } from "./models/bot.model";
import { Profession } from "./models/professions.model";
import { addAbortListener } from "events";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectModel(Profession) private readonly professionModel: typeof Profession
  ) {}

  async onStart(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user) {
        await this.botModel.create({
          user_id,
          user_name: ctx.from?.username,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          lang: ctx.from?.language_code,
        });

        await ctx.reply(`Iltimos Ro'yxatdan o'tish tugmasini bosing:`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["Ro'yxatdan o'tish 👨‍💻"]])
            .resize()
            .oneTime(),
        });
      } else {
        await ctx.reply(
          `BU BOT MAQSADI MAISHIY XIZMATLARGA NAVBATNI TELEGRAM ORQALI TIZIMLASHTIRISH`,
          {
            ...Markup.removeKeyboard(),
          }
        );
      }
    } catch (error) {
      console.log("onStart error: ", error);
    }
  }

  async onRegistration(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        await ctx.reply(`Ro'yxatdan o'tish turini tanlang: 👇`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["Usta 👨‍🔧", "Mijoz 👤"]])
            .resize()
            .oneTime(),
        });
      }
    } catch (error) {
      console.log("onRegistration error: ", error);
    }
  }

  async onClickMaster(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else if (!user.role) {
        user.role = "master";
        await user.save();

        await ctx.reply("Iltimos ish turini tanlang:", {
          parse_mode: "HTML",
          ...Markup.keyboard([
            ["SARTAROSHXONA", "GO'ZALLIK SALONI"],
            ["ZARGARLIK USTAXONASI", "SOATSOZ"],
            ["POYABZAL USTASI"],
          ]),
        });
      }
    } catch (error) {
      console.log("onClickMaster error: ", error);
    }
  }

  async onCommanAdmin(ctx: Context) {
    try {
      await ctx.reply("Kasb qo'shish uchun <b>Kasb qo'shish 🧑‍💻</b> ni bosing", {
        parse_mode: "HTML",
        ...Markup.keyboard([["Kasb qo'shish 🧑‍💻"]])
          .resize()
          .oneTime(),
      });
    } catch (error) {
      console.log("onCommanAdmin error: ", error);
    }
  }

  async onAddProfession(ctx: Context) {
    try {
      await this.professionModel.create({ last_state: "name" });
      await ctx.reply("Kasb nomini kiriting masalan <b>Tikuvchi</b>", {
        parse_mode: "HTML",
        ...Markup.removeKeyboard(),
      });
    } catch (error) {
      console.log("onAddPerfission error ", error);
    }
  }

  async onText(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;

        if (user_id == process.env.ADMIN) {
          const profession = await this.professionModel.findOne({
            where: {
              last_state: "name",
            },
            order: [["id", "DESC"]],
          });
          if (profession && !profession.name) {
            profession.name = ctx.message.text;
            await profession.save();

            await ctx.replyWithHTML("Yangi kasb muvaffaqqiyatli saqlandi✅", {
              ...Markup.removeKeyboard(),
            });
          }
        }

        const user = await this.botModel.findByPk(user_id);
      }
    } catch (error) {
      console.log("onText error: ", error);
    }
  }
}
