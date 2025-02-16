import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Context, Markup, Telegraf } from "telegraf";
import { Bot } from "./models/bot.model";
import { Profession } from "./models/professions.model";
import { Master } from "./models/master.model";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "src/app.constants";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectModel(Profession)
    private readonly professionModel: typeof Profession,
    @InjectModel(Master) private readonly masterModel: typeof Master,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
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
          status: true,
        });
      } else if (user && !user.status) {
        user.status = true;
        await user.save();
      }

      await ctx.reply(`Iltimos Ro'yxatdan o'tish tugmasini bosing:`, {
        parse_mode: "HTML",
        ...Markup.keyboard([["Ro'yxatdan o'tish 👨‍💻"]])
          .resize()
          .oneTime(),
      });
    } catch (error) {
      console.log("onStart error: ", error);
    }
  }



  async onStop(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);

      if (user && user.status) {
        user.status = false;
        await user.save();

        await ctx.reply("Sizni yana kutib qolamiz😕", {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log("onStop error: ", error);
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



  async onClickOneWorkingTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "one_working_time") {
          const one_working_time = ctx.callbackQuery!["data"].split("__")[1];
          master.one_working_time = one_working_time;
          master.last_state = "is_confirmed";
          await master.save();

          await ctx.reply("Tasdiqlaysizmi:", {
            ...Markup.keyboard([["Tasdiqlash✅", "Bekor qilish❌"]]).resize(),
          });
        }
      }
    } catch (error) {
      console.log("onClickOneWorkingTime error: ", error);
    }
  }


  async onClickEndWorkTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "end_work_time") {
          const end_work_time = ctx.callbackQuery!["data"].split("__")[1];
          console.log(end_work_time);
          
          master.end_work_time = end_work_time;
          master.last_state = "one_working_time";
          await master.save();

          await ctx.reply(
            "Har bir mijoz uchun o'rtacha sarflanadigan vaqtni tanlang:",
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "15 daqiqa🕒",
                      callback_data: "one_working_time__15",
                    },
                  ],
                  [
                    {
                      text: "30 daqiqa🕞",
                      callback_data: "one_working_time__30",
                    },
                  ],
                  [{ text: "1 soat🕐", callback_data: "one_working_time__60" }],
                ],
              },
            }
          );
        }
      }
    } catch (error) {
      console.log("onClickEndWorkTime error: ", error);
    }
  }




  async onClickStartWorkTime(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "start_work_time") {
          const start_work_time = ctx.callbackQuery!["data"].split("__")[1];
          master.start_work_time = start_work_time;
          master.last_state = "end_work_time";
          await master.save();

          await ctx.reply("Iltimos ish tugash vaqtingizni kiriting:", {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "13:00 ☀️", callback_data: "end_work_time__13" },
                  { text: "14:00 ☀️", callback_data: "end_work_time__14" },
                  { text: "15:00 ☀️", callback_data: "end_work_time__15" },
                  { text: "16:00 ☀️", callback_data: "end_work_time__16" },
                ],
                [
                  { text: "17:00 🌄", callback_data: "end_work_time__17" },
                  { text: "18:00 🌄", callback_data: "end_work_time__18" },
                  { text: "19:00 🌄", callback_data: "end_work_time__19" },
                  { text: "20:00 🌙", callback_data: "end_work_time__20" },
                ],
                [
                  { text: "21:00 🌙", callback_data: "end_work_time__21" },
                  { text: "22:00 🌙", callback_data: "end_work_time__22" },
                  { text: "23:00 🌙", callback_data: "end_work_time__23" },
                ],
              ],
              remove_keyboard: true,
            },
          });
        }
      }
    } catch (error) {
      console.log("onClickStartWorkTime error: ", error);
    }
  }




  async onClickProfession(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({
        where: { user_id, status: true },
      });

      if (!user) {
        await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
          parse_mode: "HTML",
          ...Markup.keyboard([["/start"]])
            .resize()
            .oneTime(),
        });
      } else if (user) {
        const profession_id = ctx.callbackQuery!["data"].split("_")[1];
        if (profession_id) {
          const profession =
            await this.professionModel.findByPk(+profession_id);

          if (profession) {
            const newMaster = await this.masterModel.create({
              user_id,
              profession_id: profession.id,
              last_state: "name",
            });

            await ctx.reply("Iltimos Ismingizni kiriting:", {
              ...Markup.removeKeyboard(),
            });
          }
        }
      }
    } catch (error) {
      console.log("onClickProfession error: ", error);
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
      } else if (user) {
        user.role = "master";
        await user.save();
        const professions = await this.professionModel.findAll({
          where: { last_state: "finish" },
        });
        let replyProfessions: any[] = [];

        professions.forEach((profession) =>
          replyProfessions.push([
            {
              text: profession.name,
              callback_data: `profession_${profession.id}`,
            },
          ])
        );

        await ctx.reply("Iltimos ish turini tanlang: ", {
          reply_markup: {
            inline_keyboard: replyProfessions,
          },
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
      const newProfession = await this.professionModel.create({
        last_state: "name",
      });
      await ctx.reply("Kasb nomini kiriting masalan <b>Tikuvchi</b>", {
        parse_mode: "HTML",
        ...Markup.removeKeyboard(),
      });
    } catch (error) {
      console.log("onAddPerfission error ", error);
    }
  }



  async onLocation(ctx: Context) {
    try {
      if ("location" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);

        if (!user || !user.status) {
          await ctx.reply(`Siz avval ro'yxatdan o'ting`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]]).resize(),
          });
        } else {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state == "location") {
            master.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`;
            master.last_state = "start_work_time";
            await master.save();
            await ctx.reply("Iltimos ish boshlash vaqtingizni kiriting:", {
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "07:00 🌅", callback_data: "start_work_time__7" },
                    { text: "08:00 🌅", callback_data: "start_work_time__8" },
                    { text: "09:00 🌅", callback_data: "start_work_time__9" },
                  ],
                  [
                    { text: "10:00 ☀️", callback_data: "start_work_time__10" },
                    { text: "11:00 ☀️", callback_data: "start_work_time__11" },
                    { text: "12:00 ☀️", callback_data: "start_work_time__12" },
                  ],
                ],
                remove_keyboard: true,
              },
            });
          }
        }
      }
    } catch (error) {
      console.log("OnLocationError: ", error);
    }
  }



  async onSkip(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);

        if (!user) {
          await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]])
              .resize()
              .oneTime(),
          });
        } else if (user && user.status) {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state == "workshop_name") {
            master.workshop_name = "";
            master.last_state = "address";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz manzilini kiriting</b> masalan <b>Amir Temur hiyoboni</b> \n<i>(majburiy emas)</i>",
              Markup.keyboard(["Tashlab ketish ➡️"]).resize()
            );
          } else if (master && master.last_state == "address") {
            master.address = "";
            master.last_state = "location";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz lokatsiyasini jo'nating:</b>\n<i>kartadan topib yuborish tavsiya etiladi</i>",
              Markup.keyboard([
                [Markup.button.locationRequest("Hozir turgan joyingiz📍")],
              ]).resize()
            );
          }
        }
      }
    } catch (error) {
      console.log("onSkip error: ", error);
    }
  }

  async onConfirmed(ctx: Context) {
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
      } else if (user && user.status) {
        const master = await this.masterModel.findOne({
          where: { user_id },
          order: [["id", "DESC"]],
        });
        if (master && master.last_state == "is_confirmed") {
          await this.bot.telegram.sendMessage(
            process.env.ADMIN!,
            `Sizga tasdiqlash uchun so'rov keldi:\nUsta ismi: ${master.name}\nUstaxona nomi: ${master.workshop_name}\nIsh boshlash vaqti: ${master.start_work_time}\nIsh tugash vaqti: ${master.end_work_time}\nTelefon raqami: ${master.phone_number}`,
            {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: "Tasdiqlash ✅",
                      callback_data: `confirm_${master.id}`,
                    },
                  ],
                  [
                    {
                      text: "Rad etish ❌",
                      callback_data: `rejected_${master.id}`,
                    },
                  ],
                ],
              },
            }
          );
          await ctx.reply("Tasdiqlash xabari muvaqqiyatli yuborildi:", {
            ...Markup.removeKeyboard()
          })
          await ctx.reply("Tez fursatlarda admin tomonidan so'rovingizga javob qaytariladi:", {
            reply_markup:{
              inline_keyboard:[
                [
                  {
                    text : "Tekshirish 🛠️",
                    callback_data:`check_${master.id}`
                  },
                  {
                    text : "Bekor qilish ❌",
                    callback_data:`reject_master__${master.id}`
                  },
                ],
                [
                  {
                    text : "Admin bilan bog'lanish 📞",
                    callback_data:`call_admin__${user_id}`
                  }
                ]
              ]
            }
          })
        }
      }
    } catch (error) {
      console.log("onConfirmed error: ", error);
    }
  }


  async onContact(ctx: Context) {
    try {
      if ("contact" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);

        if (!user) {
          await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]])
              .resize()
              .oneTime(),
          });
        } else if (user && user.status) {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state == "phone_number") {
            master.phone_number = ctx.message.contact.phone_number;
            master.last_state = "workshop_name";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz nomini kiriting</b> <i>(majburiy emas)</i>:",
              Markup.keyboard(["Tashlab ketish ➡️"]).resize()
            );
          }
        }
      }
    } catch (error) {
      console.log("onText error: ", error);
    }
  }



  async onText(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findByPk(user_id);

        if (!user) {
          await ctx.reply(`Iltimos oldin botni qayta ishga tushuring`, {
            parse_mode: "HTML",
            ...Markup.keyboard([["/start"]])
              .resize()
              .oneTime(),
          });
        } else if (user && user.status) {
          const master = await this.masterModel.findOne({
            where: { user_id },
            order: [["id", "DESC"]],
          });
          if (master && master.last_state == "name") {
            master.name = ctx.message.text;
            master.last_state = "phone_number";
            await master.save();
            await ctx.reply(
              "Iltimos, telefon raqamingizni ulashing:",
              Markup.keyboard([
                [Markup.button.contactRequest("📞 Kontaktni ulashish")],
              ]).resize()
            );
          } else if (master && master.last_state == "workshop_name") {
            master.workshop_name = ctx.message.text;
            master.last_state = "address";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz manzilini kiriting</b> masalan <b>Amir Temur hiyoboni</b> \n<i>(majburiy emas)</i>",
              Markup.keyboard(["Tashlab ketish ➡️"]).resize()
            );
          } else if (master && master.last_state == "address") {
            master.address = ctx.message.text;
            master.last_state = "location";
            await master.save();

            await ctx.replyWithHTML(
              "<b>Iltimos ustaxonangiz lokatsiyasini jo'nating:</b>\n<i>kartadan topib yuborish tavsiya etiladi</i>",
              Markup.keyboard([
                [Markup.button.locationRequest("Hozir turgan joyingiz📍")],
              ]).resize()
            );
          }
        }
        if (user_id == process.env.ADMIN) {
          const profession = await this.professionModel.findOne({
            where: {
              last_state: "name",
            },
            order: [["id", "DESC"]],
          });
          if (profession && !profession.name) {
            profession.name = ctx.message.text;
            profession.last_state = "finish";
            await profession.save();

            await ctx.replyWithHTML("Yangi kasb muvaffaqqiyatli saqlandi✅", {
              ...Markup.removeKeyboard(),
            });
          }
        }
      }
    } catch (error) {
      console.log("onText error: ", error);
    }
  }
}
